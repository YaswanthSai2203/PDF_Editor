"use client";

import { useEffect, useMemo, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  FileSignature,
  GripVertical,
  Image as ImageIcon,
  Link2,
  LayoutTemplate,
  RotateCcw,
  RotateCw,
  Signature,
  Upload,
  Type,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EditorToolbar } from "@/features/editor/components/editor-toolbar";
import type { EditorElementKind } from "@/features/editor/domain/editor-element";
import type { EditorElementRect } from "@/features/editor/domain/editor-element";
import { useEditorStore } from "@/features/editor/services/editor-store";
import {
  createEditorElementOnServer,
  deleteEditorElementOnServer,
  enqueueEditorRectSync,
  enqueueEditorTextSync,
  fetchEditorElements,
} from "@/features/editor/services/editor-api";
import { PageOrganizerPanel } from "@/features/page-organizer/components/page-organizer-panel";
import type {
  PageOperationEntity,
  PageOperationType,
} from "@/features/page-organizer/domain/page-organizer";
import {
  createPageOperationOnServer,
  deletePageOperationOnServer,
  fetchPageOperations,
} from "@/features/page-organizer/services/page-organizer-api";
import { usePageOrganizerStore } from "@/features/page-organizer/services/page-organizer-store";
import { FormsPanel } from "@/features/forms/components/forms-panel";
import type {
  FormFieldEntity,
  FormFieldType,
} from "@/features/forms/domain/form-field";
import {
  createFormFieldOnServer,
  deleteFormFieldOnServer,
  fetchFormFields,
  submitFormValuesOnServer,
  updateFormFieldOnServer,
} from "@/features/forms/services/forms-api";
import { useFormsStore } from "@/features/forms/services/forms-store";
import { SignaturePanel } from "@/features/signature/components/signature-panel";
import type {
  CreateSignatureRequestInput,
  SignatureRecipientInput,
  SignatureRecipientEntity,
  SignatureRequestEntity,
} from "@/features/signature/domain/signature-request";
import {
  createSignatureRequestOnServer,
  fetchSignatureRequests,
  sendSignatureRequestOnServer,
  updateSignatureRequestOnServer,
} from "@/features/signature/services/signature-api";
import { useSignatureStore } from "@/features/signature/services/signature-store";
import { PdfJsLoaderService } from "@/features/pdf-viewer/services/pdf-loader.service";

import { PdfCanvasPage } from "./pdf-canvas-page";
import { PdfThumbnail } from "./pdf-thumbnail";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.1;
const MAX_EAGER_PAGES = 30;
const MAX_ORGANIZER_PAGES = 120;

type FitMode = "width" | "page";

interface PdfViewerProps {
  sourceUrl: string;
}

type InteractionMode = "annotate" | "edit";

function toViewerSource(url: string): string {
  const trimmed = url.trim();
  return trimmed.length > 0 ? trimmed : "";
}

function deriveDocumentKey(source: string): { documentKey: string; documentId: string | null } {
  try {
    const parsed = new URL(source, "https://viewer.local");
    const documentId = parsed.searchParams.get("docId");
    parsed.searchParams.delete("docId");
    const query = parsed.searchParams.toString();
    const normalized = query ? `${parsed.pathname}?${query}` : parsed.pathname;
    return { documentKey: normalized, documentId };
  } catch {
    return { documentKey: source, documentId: null };
  }
}

function buildWindow(center: number, total: number, radius: number): number[] {
  if (total <= 0) {
    return [];
  }

  const start = Math.max(1, center - radius);
  const end = Math.min(total, center + radius);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function hasPageLoaded(
  store: Record<number, PDFPageProxy>,
  pageNumber: number,
): boolean {
  return Object.hasOwn(store, pageNumber);
}

function buildInitialOrder(totalPages: number): number[] {
  return Array.from({ length: totalPages }, (_, index) => index + 1);
}

function applyOperations(totalPages: number, operations: PageOperationEntity[]): {
  orderedPages: number[];
  rotationByOriginalPage: Record<number, number>;
} {
  const orderedPages = buildInitialOrder(totalPages);
  const rotationByOriginalPage: Record<number, number> = {};
  for (let page = 1; page <= totalPages; page += 1) {
    rotationByOriginalPage[page] = 0;
  }

  for (const operation of operations) {
    if (operation.type === "REORDER") {
      const payload = operation.payload;
      if (
        !("fromPage" in payload) ||
        !("toPage" in payload) ||
        typeof payload.fromPage !== "number" ||
        typeof payload.toPage !== "number"
      ) {
        continue;
      }
      const fromIndex = orderedPages.findIndex(
        (page) => page === payload.fromPage,
      );
      const toIndex = orderedPages.findIndex(
        (page) => page === payload.toPage,
      );
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        continue;
      }
      const [moved] = orderedPages.splice(fromIndex, 1);
      orderedPages.splice(toIndex, 0, moved);
      continue;
    }

    if (operation.type === "ROTATE") {
      const payload = operation.payload;
      if (
        !("pageNumber" in payload) ||
        !("deltaDegrees" in payload) ||
        typeof payload.pageNumber !== "number" ||
        typeof payload.deltaDegrees !== "number"
      ) {
        continue;
      }
      const page = payload.pageNumber;
      const delta = payload.deltaDegrees;
      const previous = rotationByOriginalPage[page] ?? 0;
      rotationByOriginalPage[page] = ((previous + delta) % 360 + 360) % 360;
    }
  }

  return { orderedPages, rotationByOriginalPage };
}

export function PdfViewer({ sourceUrl }: PdfViewerProps) {
  const loader = useMemo(() => new PdfJsLoaderService(), []);
  const [runtimeSourceUrl, setRuntimeSourceUrl] = useState<string>(sourceUrl);
  const [sourceInputValue, setSourceInputValue] = useState<string>(sourceUrl);
  const { documentKey, documentId: persistedDocumentId } = useMemo(
    () => deriveDocumentKey(runtimeSourceUrl),
    [runtimeSourceUrl],
  );
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("edit");
  const [imageDraftUrl, setImageDraftUrl] = useState<string>("");

  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<Record<number, PDFPageProxy>>({});
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [fitMode, setFitMode] = useState<FitMode>("width");
  const [showTextLayer, setShowTextLayer] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [showOrganizerPanel, setShowOrganizerPanel] = useState<boolean>(false);
  const [showSignaturePanel, setShowSignaturePanel] = useState<boolean>(false);
  const [showFormsPanel, setShowFormsPanel] = useState<boolean>(false);
  const [thumbnailPages, setThumbnailPages] = useState<Record<number, PDFPageProxy>>(
    {},
  );
  const editorElementsByDocument = useEditorStore((state) => state.elementsByDocument);
  const editorSelectedElementId = useEditorStore((state) => state.selectedElementId);
  const editorActiveTool = useEditorStore((state) => state.activeTool);
  const setEditorActiveTool = useEditorStore((state) => state.setActiveTool);
  const selectEditorElement = useEditorStore((state) => state.selectElement);
  const setDocumentElements = useEditorStore((state) => state.setDocumentElements);
  const createElement = useEditorStore((state) => state.createElement);
  const replaceElement = useEditorStore((state) => state.replaceElement);
  const deleteElement = useEditorStore((state) => state.deleteElement);
  const updateElementRect = useEditorStore((state) => state.updateElementRect);
  const updateElementTextContent = useEditorStore(
    (state) => state.updateElementTextContent,
  );
  const getElementById = useEditorStore((state) => state.getElementById);
  const editorUndo = useEditorStore((state) => state.undo);
  const editorRedo = useEditorStore((state) => state.redo);
  const editorCanUndo = useEditorStore((state) => state.canUndo(documentKey));
  const editorCanRedo = useEditorStore((state) => state.canRedo(documentKey));
  const operationsByDocument = usePageOrganizerStore(
    (state) => state.operationsByDocument,
  );
  const setDocumentOperations = usePageOrganizerStore(
    (state) => state.setDocumentOperations,
  );
  const createOperation = usePageOrganizerStore((state) => state.createOperation);
  const replaceOperation = usePageOrganizerStore((state) => state.replaceOperation);
  const deleteOperation = usePageOrganizerStore((state) => state.deleteOperation);
  const organizerUndo = usePageOrganizerStore((state) => state.undo);
  const organizerRedo = usePageOrganizerStore((state) => state.redo);
  const organizerCanUndo = usePageOrganizerStore((state) => state.canUndo(documentKey));
  const organizerCanRedo = usePageOrganizerStore((state) => state.canRedo(documentKey));
  const getOperationById = usePageOrganizerStore((state) => state.getOperationById);
  const signatureRequestsByDocument = useSignatureStore(
    (state) => state.requestsByDocument,
  );
  const selectedSignatureRequestId = useSignatureStore(
    (state) => state.selectedRequestIdByDocument[documentKey] ?? null,
  );
  const setSignatureRequests = useSignatureStore((state) => state.setDocumentRequests);
  const createLocalSignatureRequest = useSignatureStore((state) => state.createLocalRequest);
  const replaceSignatureRequest = useSignatureStore((state) => state.replaceRequest);
  const updateSignatureRequestStatus = useSignatureStore((state) => state.updateRequestStatus);
  const getSelectedSignatureRequest = useSignatureStore((state) => state.getSelectedRequest);
  const selectSignatureRequest = useSignatureStore((state) => state.selectRequest);
  const formFieldsByDocument = useFormsStore((state) => state.fieldsByDocument);
  const selectedFormFieldId = useFormsStore((state) => state.selectedFieldIdByDocument[documentKey] ?? null);
  const setDocumentFormFields = useFormsStore((state) => state.setDocumentFields);
  const createLocalFormField = useFormsStore((state) => state.createLocalField);
  const replaceFormField = useFormsStore((state) => state.replaceField);
  const deleteFormField = useFormsStore((state) => state.deleteField);
  const selectFormField = useFormsStore((state) => state.selectField);
  const setFormFieldValue = useFormsStore((state) => state.setFieldValue);
  const clearFormFieldValue = useFormsStore((state) => state.clearFieldValue);

  useEffect(() => {
    setRuntimeSourceUrl(sourceUrl);
    setSourceInputValue(sourceUrl);
  }, [sourceUrl]);

  useEffect(() => {
    let isCancelled = false;
    setIsInitialLoading(true);
    setPdfDocument(null);
    setPages({});
    setThumbnailPages({});
    setPageNumber(1);

    void loader
      .load({ sourceUrl: runtimeSourceUrl })
      .then((pdfDoc) => {
        if (isCancelled) {
          return;
        }

        setPdfDocument(pdfDoc);
        setError(null);

        void pdfDoc
          .getPage(1)
          .then((firstPage) => {
            if (isCancelled) {
              return;
            }
            setPages({ 1: firstPage });
            setThumbnailPages({ 1: firstPage });
          })
          .catch(() => {
            if (!isCancelled) {
              setError("Unable to render first page.");
            }
          });
      })
      .catch((loadError: unknown) => {
        if (isCancelled) {
          return;
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : "Unable to load PDF document.";
        setError(message);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsInitialLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [loader, runtimeSourceUrl]);

  useEffect(() => {
    if (!persistedDocumentId) {
      setDocumentElements(documentKey, []);
      return;
    }

    let isCancelled = false;
    void fetchEditorElements(persistedDocumentId, documentKey)
      .then((loaded) => {
        if (!isCancelled) {
          setDocumentElements(documentKey, loaded);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError("Unable to load saved editor elements.");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [documentKey, persistedDocumentId, setDocumentElements]);

  useEffect(() => {
    if (!persistedDocumentId) {
      setDocumentOperations(documentKey, []);
      return;
    }

    let isCancelled = false;
    void fetchPageOperations(persistedDocumentId, documentKey)
      .then((loaded) => {
        if (!isCancelled) {
          setDocumentOperations(documentKey, loaded);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError("Unable to load saved page operations.");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [documentKey, persistedDocumentId, setDocumentOperations]);

  useEffect(() => {
    if (!persistedDocumentId) {
      setSignatureRequests(documentKey, []);
      return;
    }

    let isCancelled = false;
    void fetchSignatureRequests(persistedDocumentId, documentKey)
      .then((loaded) => {
        if (!isCancelled) {
          setSignatureRequests(documentKey, loaded);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError("Unable to load signature requests.");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [documentKey, persistedDocumentId, setSignatureRequests]);

  useEffect(() => {
    if (!persistedDocumentId) {
      setDocumentFormFields(documentKey, []);
      return;
    }

    let isCancelled = false;
    void fetchFormFields(persistedDocumentId, documentKey)
      .then((loaded) => {
        if (!isCancelled) {
          setDocumentFormFields(documentKey, loaded);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError("Unable to load form fields.");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [documentKey, persistedDocumentId, setDocumentFormFields]);

  useEffect(() => {
    if (!pdfDocument) {
      return;
    }

    let isCancelled = false;
    const renderWindow = buildWindow(pageNumber, pdfDocument.numPages, 8);
    const missingPages = renderWindow.filter(
      (targetPage) => !hasPageLoaded(pages, targetPage),
    );

    if (missingPages.length === 0) {
      return;
    }

    void Promise.all(
      missingPages.map(async (targetPage) => ({
        targetPage,
        page: await pdfDocument.getPage(targetPage),
      })),
    )
      .then((loadedPages) => {
        if (isCancelled) {
          return;
        }

        setPages((previous) => {
          const next = { ...previous };
          loadedPages.forEach(({ targetPage, page }) => {
            next[targetPage] = page;
          });
          return next;
        });
      })
      .catch(() => {
        if (!isCancelled) {
          setError("Unable to render page window.");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [pageNumber, pages, pdfDocument]);

  useEffect(() => {
    if (!pdfDocument) {
      return;
    }

    let isCancelled = false;
    const thumbnailWindow = buildWindow(pageNumber, pdfDocument.numPages, 32).slice(
      0,
      MAX_EAGER_PAGES,
    );
    const missingThumbnails = thumbnailWindow.filter(
      (targetPage) => !hasPageLoaded(thumbnailPages, targetPage),
    );

    if (missingThumbnails.length === 0) {
      return;
    }

    void Promise.all(
      missingThumbnails.map(async (targetPage) => ({
        targetPage,
        page: await pdfDocument.getPage(targetPage),
      })),
    )
      .then((loadedPages) => {
        if (isCancelled) {
          return;
        }

        setThumbnailPages((previous) => {
          const next = { ...previous };
          loadedPages.forEach(({ targetPage, page }) => {
            next[targetPage] = page;
          });
          return next;
        });
      })
      .catch(() => {
        if (!isCancelled) {
          setError("Unable to render thumbnail previews.");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [pageNumber, pdfDocument, thumbnailPages]);

  const totalPages = pdfDocument?.numPages ?? 0;
  const allCurrentDocumentOperations = useMemo(
    () => operationsByDocument[documentKey] ?? [],
    [documentKey, operationsByDocument],
  );
  const { orderedPages, rotationByOriginalPage } = useMemo(
    () => applyOperations(totalPages, allCurrentDocumentOperations),
    [allCurrentDocumentOperations, totalPages],
  );
  const renderWindow = useMemo(
    () => buildWindow(pageNumber, totalPages, 8),
    [pageNumber, totalPages],
  );
  const thumbnailWindow = useMemo(
    () => buildWindow(pageNumber, totalPages, 32).slice(0, MAX_EAGER_PAGES),
    [pageNumber, totalPages],
  );

  const canGoBack = pageNumber > 1;
  const canGoForward = totalPages > 0 && pageNumber < totalPages;

  const zoomLabel = `${Math.round(scale * 100)}%`;
  const allCurrentDocumentEditorElements = editorElementsByDocument[documentKey] ?? [];
  const allCurrentDocumentSignatureRequests =
    signatureRequestsByDocument[documentKey] ?? [];
  const allCurrentDocumentFormFields = formFieldsByDocument[documentKey] ?? [];
  const selectedSignatureRequest =
    getSelectedSignatureRequest(documentKey) ?? null;
  const canDeleteEditorSelection = allCurrentDocumentEditorElements.some(
    (item) => item.id === editorSelectedElementId,
  );

  function getDisplayIndexForOriginalPage(originalPage: number): number {
    const displayIndex = orderedPages.findIndex((item) => item === originalPage);
    return displayIndex >= 0 ? displayIndex + 1 : originalPage;
  }

  function getOriginalPageForDisplayIndex(displayIndex: number): number {
    if (displayIndex < 1 || displayIndex > orderedPages.length) {
      return orderedPages[0] ?? 1;
    }
    return orderedPages[displayIndex - 1];
  }

  function scrollToPage(targetPageNumber: number) {
    const boundedPageNumber = Math.max(1, Math.min(targetPageNumber, totalPages || 1));
    setPageNumber(boundedPageNumber);

    requestAnimationFrame(() => {
      const pageElement = globalThis.document.getElementById(
        `pdf-page-${boundedPageNumber}`,
      );
      pageElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function createPageOperation(
    type: PageOperationType,
    payload:
      | {
          fromPage: number;
          toPage: number;
        }
      | {
          pageNumber: number;
          deltaDegrees: -90 | 90 | 180;
        },
  ) {
    const created = createOperation({
      documentKey,
      type,
      payload,
    });

    if (!persistedDocumentId) {
      return;
    }

    void createPageOperationOnServer(persistedDocumentId, created)
      .then((saved) => {
        replaceOperation(documentKey, created.id, saved);
      })
      .catch(() => {
        setError("Failed to persist page operation. Keeping local change.");
      });
  }

  function handleDeleteOperation(operationId: string) {
    const target = getOperationById(documentKey, operationId);
    deleteOperation(documentKey, operationId);
    if (!target?.persisted) {
      return;
    }
    void deletePageOperationOnServer(operationId).catch(() => {
      setError("Failed to delete page operation on server.");
    });
  }

  function handleCreateSignatureRequest(input: CreateSignatureRequestInput) {
    const now = new Date().toISOString();
    const localRecipients: SignatureRecipientEntity[] = input.recipients.map(
      (recipient, index) => ({
        id: `sig_rec_local_${Math.random().toString(36).slice(2)}`,
        signatureRequestId: "",
        email: recipient.email,
        displayName: recipient.displayName,
        signingOrder: recipient.signingOrder ?? index + 1,
        status: "PENDING",
        createdAt: now,
        updatedAt: now,
      }),
    );

    const created = createLocalSignatureRequest(documentKey, {
      documentKey,
      persistedDocumentId: persistedDocumentId ?? undefined,
      persisted: false,
      documentId: input.documentId,
      title: input.title,
      message: input.message,
      expiresAt: input.expiresAt,
      status: "DRAFT",
      recipients: localRecipients,
      completedAt: undefined,
    });

    selectSignatureRequest(documentKey, created.id);

    if (!persistedDocumentId) {
      return;
    }

    void createSignatureRequestOnServer({
      documentId: persistedDocumentId,
      documentKey,
      title: input.title,
      message: input.message,
      expiresAt: input.expiresAt,
      recipients: input.recipients,
    })
      .then((saved) => {
        replaceSignatureRequest(documentKey, created.id, saved);
        selectSignatureRequest(documentKey, saved.id);
      })
      .catch(() => {
        setError("Failed to create signature request on server.");
      });
  }

  function handleCreateFormField(input: {
    pageNumber: number;
    name: string;
    fieldType: FormFieldType;
  }) {
    if (!persistedDocumentId) {
      setError("Attach a persisted document (docId) before creating form fields.");
      return;
    }

    const local = createLocalFormField(documentKey, {
      documentId: persistedDocumentId,
      documentKey,
      persistedDocumentId: persistedDocumentId,
      persisted: false,
      pageNumber: input.pageNumber,
      name: input.name,
      fieldType: input.fieldType,
      rect: {
        xPct: 12,
        yPct: 20,
        widthPct: 24,
        heightPct: 7,
      },
      required: false,
      label: input.name,
      value: "",
    });

    void createFormFieldOnServer({
      documentId: persistedDocumentId,
      documentKey,
      field: {
        documentId: persistedDocumentId,
        pageNumber: input.pageNumber,
        name: input.name,
        fieldType: input.fieldType,
        rect: {
          xPct: 12,
          yPct: 20,
          widthPct: 24,
          heightPct: 7,
        },
        required: false,
      },
    })
      .then((saved) => {
        replaceFormField(documentKey, local.id, saved);
      })
      .catch(() => {
        setError("Failed to create form field on server.");
      });
  }

  function handleUpdateFormField(
    fieldId: string,
    updates: {
      name?: string;
      required?: boolean;
      rect?: {
        xPct: number;
        yPct: number;
        widthPct: number;
        heightPct: number;
      };
    },
  ) {
    const target = allCurrentDocumentFormFields.find((field) => field.id === fieldId);
    if (!target || !target.documentId) {
      return;
    }
    const merged: FormFieldEntity = {
      ...target,
      ...updates,
      ...(updates.rect ? { rect: updates.rect } : {}),
      updatedAt: new Date().toISOString(),
    };
    replaceFormField(documentKey, fieldId, merged);

    void updateFormFieldOnServer(fieldId, {
      name: updates.name,
      required: updates.required,
      rect: updates.rect,
    }).catch(() => {
      setError("Failed to update form field on server.");
    });
  }

  function handleSubmitFormFieldValue(fieldId: string, value: string) {
    const target = allCurrentDocumentFormFields.find((field) => field.id === fieldId);
    if (!target) {
      return;
    }
    setFormFieldValue(documentKey, fieldId, value);
    if (!target.documentId) {
      return;
    }
    void submitFormValuesOnServer(fieldId, value).catch(() => {
      setError("Failed to save form field value.");
    });
  }

  function handleDeleteFormField(fieldId: string) {
    const target = allCurrentDocumentFormFields.find((field) => field.id === fieldId);
    if (!target) {
      return;
    }
    deleteFormField(documentKey, fieldId);
    clearFormFieldValue(documentKey, fieldId);
    if (!target.persisted) {
      return;
    }
    void deleteFormFieldOnServer(fieldId).catch(() => {
      setError("Failed to delete form field.");
    });
  }

  function handleUpdateSignatureRequest(
    requestId: string,
    updates: {
      title?: string;
      message?: string;
      expiresAt?: string;
      recipients?: SignatureRecipientInput[];
    },
  ) {
    const existing = allCurrentDocumentSignatureRequests.find(
      (item) => item.id === requestId,
    );
    if (!existing) {
      return;
    }

    const mergedLocal: SignatureRequestEntity = {
      ...existing,
      ...(typeof updates.title === "string" ? { title: updates.title } : {}),
      ...(typeof updates.message === "string" ? { message: updates.message } : {}),
      ...(typeof updates.expiresAt === "string" ? { expiresAt: updates.expiresAt } : {}),
      ...(updates.recipients
        ? {
            recipients: updates.recipients.map((recipient, index) => ({
              id: existing.recipients[index]?.id ?? `sig_rec_local_${Math.random().toString(36).slice(2)}`,
              signatureRequestId: existing.id,
              email: recipient.email,
              displayName: recipient.displayName,
              signingOrder: recipient.signingOrder ?? index + 1,
              status: existing.recipients[index]?.status ?? "PENDING",
              createdAt: existing.recipients[index]?.createdAt ?? new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })),
          }
        : {}),
      updatedAt: new Date().toISOString(),
    };
    replaceSignatureRequest(documentKey, existing.id, mergedLocal);

    if (!existing.persisted || !existing.persistedDocumentId) {
      return;
    }

    void updateSignatureRequestOnServer(requestId, documentKey, updates)
      .then((saved) => {
        replaceSignatureRequest(documentKey, requestId, {
          ...saved,
          documentKey,
          persistedDocumentId: existing.persistedDocumentId,
        });
      })
      .catch(() => {
        setError("Failed to update signature request on server.");
      });
  }

  function handleSendSignatureRequest(requestId: string) {
    const existing = allCurrentDocumentSignatureRequests.find(
      (item) => item.id === requestId,
    );
    if (!existing) {
      return;
    }
    if (!existing.persisted || !existing.persistedDocumentId) {
      setError("Save request before sending.");
      return;
    }
    void sendSignatureRequestOnServer(requestId, documentKey)
      .then((saved) => {
        replaceSignatureRequest(documentKey, requestId, {
          ...saved,
          documentKey,
          persistedDocumentId: existing.persistedDocumentId,
        });
        updateSignatureRequestStatus(documentKey, requestId, "SENT");
      })
      .catch(() => {
        setError("Failed to send signature request.");
      });
  }

  function handleMovePage(fromOriginalPage: number, toOriginalPage: number) {
    if (fromOriginalPage === toOriginalPage) {
      return;
    }
    createPageOperation("REORDER", {
      fromPage: fromOriginalPage,
      toPage: toOriginalPage,
    });
    setPageNumber(toOriginalPage);
  }

  function handleRotatePage(page: number, delta: -90 | 90 | 180) {
    createPageOperation("ROTATE", {
      pageNumber: page,
      deltaDegrees: delta,
    });
  }

  function handleApplySourceInput() {
    const next = toViewerSource(sourceInputValue);
    if (!next) {
      return;
    }
    setRuntimeSourceUrl(next);
    setPageNumber(1);
    setError(null);
  }

  function handleLocalPdfUpload(file: File | null) {
    if (!file) {
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setRuntimeSourceUrl(objectUrl);
    setSourceInputValue(objectUrl);
    setPageNumber(1);
    setError(null);
  }

  function handleLocalImageUpload(file: File | null) {
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Only image files are supported for image elements.");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setImageDraftUrl(objectUrl);
    setEditorActiveTool("IMAGE");
    setError(null);
  }

  function handleCreateEditorElement(
    targetPageNumber: number,
    kind: EditorElementKind,
    rect: EditorElementRect,
    value?: string,
  ) {
    const created = createElement({
      documentKey,
      pageNumber: targetPageNumber,
      kind,
      rect,
      textContent: kind === "TEXT" ? value : undefined,
      imageSrc: kind === "IMAGE" ? value : undefined,
    });

    if (!persistedDocumentId) {
      return;
    }

    void createEditorElementOnServer(persistedDocumentId, created)
      .then((saved) => {
        replaceElement(documentKey, created.id, saved);
      })
      .catch(() => {
        setError("Failed to persist editor element. Keeping local change.");
      });
  }

  function handleUpdateEditorElementRect(elementId: string, rect: EditorElementRect) {
    updateElementRect(documentKey, elementId, rect);
    const target = getElementById(documentKey, elementId);
    if (!target?.persisted) {
      return;
    }
    enqueueEditorRectSync(elementId, rect, target.syncVersion ?? 0);
  }

  function handleUpdateEditorElementValue(elementId: string, value: string) {
    const target = getElementById(documentKey, elementId);
    if (!target) {
      return;
    }

    if (target.kind === "TEXT") {
      updateElementTextContent(documentKey, elementId, value);
      const latest = getElementById(documentKey, elementId);
      if (!latest?.persisted) {
        return;
      }
      enqueueEditorTextSync(
        elementId,
        value,
        {
          color: latest.textStyle?.color ?? "#111827",
          fontSizePx: latest.textStyle?.fontSizePx ?? 16,
        },
        latest.syncVersion ?? 0,
      );
    }
  }

  function handleDeleteEditorSelection() {
    if (!editorSelectedElementId) {
      return;
    }
    const target = allCurrentDocumentEditorElements.find(
      (item) => item.id === editorSelectedElementId,
    );
    deleteElement(documentKey, editorSelectedElementId);
    if (!target?.persisted) {
      return;
    }
    void deleteEditorElementOnServer(editorSelectedElementId).catch(() => {
      setError("Failed to delete editor element on server.");
    });
  }

  return (
    <section className="flex h-full min-h-[70vh] flex-col overflow-hidden">
      <div className="border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="min-w-[240px] flex-1"
            value={sourceInputValue}
            onChange={(event) => setSourceInputValue(event.target.value)}
            placeholder="Paste a direct PDF URL"
            aria-label="PDF source URL"
          />
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleApplySourceInput}
          >
            <Link2 className="h-4 w-4" />
            Load URL
          </Button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900">
            <Upload className="h-4 w-4" />
            Upload PDF
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) =>
                handleLocalPdfUpload(event.target.files?.[0] ?? null)
              }
            />
          </label>
        </div>
      </div>
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => scrollToPage(Math.max(1, pageNumber - 1))}
            disabled={!canGoBack}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Input
            className="w-20 text-center"
            inputMode="numeric"
            value={pageNumber}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              if (Number.isNaN(parsed)) {
                return;
              }

              if (!totalPages) {
                scrollToPage(Math.max(1, parsed));
                return;
              }

              scrollToPage(Math.max(1, Math.min(parsed, totalPages)));
            }}
            aria-label="Current page number"
          />

          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            / {totalPages || "–"}
          </span>

          <Button
            size="icon"
            variant="outline"
            onClick={() => scrollToPage(Math.min(totalPages, pageNumber + 1))}
            disabled={!canGoForward}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1 rounded-md border border-zinc-300 p-1 dark:border-zinc-700">
            <Button
              size="sm"
              variant={interactionMode === "annotate" ? "secondary" : "ghost"}
              onClick={() => setInteractionMode("annotate")}
            >
              Annotate
            </Button>
            <Button
              size="sm"
              variant={interactionMode === "edit" ? "secondary" : "ghost"}
              onClick={() => setInteractionMode("edit")}
            >
              Edit
            </Button>
          </div>

          {interactionMode === "edit" ? (
            <>
              <EditorToolbar
                activeTool={editorActiveTool}
                onToolChange={setEditorActiveTool}
                canDeleteSelection={canDeleteEditorSelection}
                onDeleteSelection={handleDeleteEditorSelection}
                canUndo={editorCanUndo}
                canRedo={editorCanRedo}
                onUndo={() => editorUndo(documentKey)}
                onRedo={() => editorRedo(documentKey)}
              />
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900">
                <ImageIcon className="h-4 w-4" />
                Image source
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    handleLocalImageUpload(event.target.files?.[0] ?? null)
                  }
                />
              </label>
            </>
          ) : (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Annotation tools are available in the annotate engine.
            </span>
          )}

          <div className="inline-flex items-center gap-1 rounded-md border border-zinc-300 p-1 dark:border-zinc-700">
            <Button
              size="sm"
              variant={showOrganizerPanel ? "secondary" : "ghost"}
              onClick={() => setShowOrganizerPanel((current) => !current)}
            >
              <GripVertical className="mr-1 h-4 w-4" />
              Organize
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleRotatePage(pageNumber, -90)}
              aria-label="Rotate current page left"
              title="Rotate left"
              disabled={!totalPages}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleRotatePage(pageNumber, 90)}
              aria-label="Rotate current page right"
              title="Rotate right"
              disabled={!totalPages}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={showSignaturePanel ? "secondary" : "ghost"}
              onClick={() => setShowSignaturePanel((current) => !current)}
            >
              <Signature className="mr-1 h-4 w-4" />
              Sign
            </Button>
            <Button
              size="sm"
              variant={showFormsPanel ? "secondary" : "ghost"}
              onClick={() => setShowFormsPanel((current) => !current)}
            >
              <FileSignature className="mr-1 h-4 w-4" />
              Forms
            </Button>
          </div>

          <Button
            size="icon"
            variant="outline"
            onClick={() =>
              setScale((current) =>
                Math.max(MIN_SCALE, Number((current - SCALE_STEP).toFixed(2))),
              )
            }
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="min-w-14 text-center text-sm text-zinc-700 dark:text-zinc-300">
            {zoomLabel}
          </span>

          <Button
            size="icon"
            variant="outline"
            onClick={() =>
              setScale((current) =>
                Math.min(MAX_SCALE, Number((current + SCALE_STEP).toFixed(2))),
              )
            }
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant={fitMode === "width" ? "secondary" : "outline"}
            onClick={() => setFitMode((current) => (current === "width" ? "page" : "width"))}
            aria-label="Toggle fit mode"
            title="Toggle fit mode"
          >
            <LayoutTemplate className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant={showTextLayer ? "secondary" : "outline"}
            onClick={() => setShowTextLayer((current) => !current)}
            aria-label="Toggle text layer"
            title="Toggle text layer"
          >
            <Type className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant={showThumbnails ? "secondary" : "outline"}
            onClick={() => setShowThumbnails((current) => !current)}
            aria-label="Toggle thumbnails"
            title="Toggle thumbnails rail"
          >
            <Columns3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "grid h-full min-h-0 grid-cols-1 bg-zinc-100 dark:bg-zinc-950/70",
          showOrganizerPanel && showSignaturePanel && showFormsPanel
            ? "md:grid-cols-[220px_1fr_320px_360px_360px]"
            : showOrganizerPanel && showSignaturePanel
              ? "md:grid-cols-[220px_1fr_320px_360px]"
              : showOrganizerPanel && showFormsPanel
                ? "md:grid-cols-[220px_1fr_320px_360px]"
                : showSignaturePanel && showFormsPanel
                  ? "md:grid-cols-[220px_1fr_360px_360px]"
                  : showOrganizerPanel
                    ? "md:grid-cols-[220px_1fr_320px]"
                    : showSignaturePanel || showFormsPanel
                      ? "md:grid-cols-[220px_1fr_360px]"
                      : "md:grid-cols-[220px_1fr]",
        )}
      >
        <aside
          className={cn(
            "min-h-0 overflow-y-auto border-r border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900",
            !showThumbnails && "hidden md:hidden",
          )}
        >
          <div className="space-y-2">
            {thumbnailWindow.map((pageIndex) => {
              const originalPage = getOriginalPageForDisplayIndex(pageIndex);
              return (
              <PdfThumbnail
                key={`thumb-${originalPage}`}
                page={thumbnailPages[originalPage] ?? null}
                pageNumber={pageIndex}
                isActive={pageNumber === originalPage}
                rotationDeg={rotationByOriginalPage[originalPage] ?? 0}
                onClick={() => scrollToPage(originalPage)}
              />
              );
            })}
            {totalPages > thumbnailWindow.length ? (
              <p className="px-2 py-1 text-xs text-zinc-500 dark:text-zinc-400">
                Virtualized thumbnails window around page {pageNumber} / {totalPages}.
              </p>
            ) : null}
          </div>
        </aside>

        <div className="min-h-0 overflow-auto p-4 md:p-6">
          <div className="mx-auto flex w-fit flex-col gap-4">
            {renderWindow.map((renderDisplayIndex) => {
              const renderPageNumber = getOriginalPageForDisplayIndex(renderDisplayIndex);
              return (
              <div
                key={`page-${renderPageNumber}`}
                id={`pdf-page-${renderPageNumber}`}
                className="scroll-mt-24"
              >
                <div className="mb-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  Page {getDisplayIndexForOriginalPage(renderPageNumber)}
                </div>
                <PdfCanvasPage
                  page={pages[renderPageNumber] ?? null}
                  pageNumber={renderPageNumber}
                  scale={fitMode === "page" ? Math.min(scale, 1.2) : scale}
                  rotationDeg={rotationByOriginalPage[renderPageNumber] ?? 0}
                  onVisible={() => setPageNumber(renderPageNumber)}
                  showTextLayer={showTextLayer}
                  interactionMode={interactionMode}
                  editorElements={allCurrentDocumentEditorElements.filter(
                    (item) => item.pageNumber === renderPageNumber,
                  )}
                  selectedEditorElementId={editorSelectedElementId}
                  activeEditorTool={editorActiveTool}
                  imageDraftUrl={imageDraftUrl}
                  onCreateEditorElement={handleCreateEditorElement}
                  onSelectEditorElement={selectEditorElement}
                  onUpdateEditorElementRect={handleUpdateEditorElementRect}
                  onUpdateEditorElementValue={handleUpdateEditorElementValue}
                />
              </div>
              );
            })}
          </div>
        </div>
        {showOrganizerPanel ? (
          <aside className="min-h-0 border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <PageOrganizerPanel
              totalPages={Math.min(totalPages, MAX_ORGANIZER_PAGES)}
              orderedPages={orderedPages.slice(0, MAX_ORGANIZER_PAGES)}
              activePage={pageNumber}
              rotationByOriginalPage={rotationByOriginalPage}
              canUndo={organizerCanUndo}
              canRedo={organizerCanRedo}
              onSelectPage={(originalPage) => scrollToPage(originalPage)}
              onMovePage={handleMovePage}
              onRotatePage={handleRotatePage}
              onUndo={() => organizerUndo(documentKey)}
              onRedo={() => organizerRedo(documentKey)}
              operations={allCurrentDocumentOperations}
              onDeleteOperation={handleDeleteOperation}
            />
          </aside>
        ) : null}
        {showSignaturePanel ? (
          <aside className="min-h-0 border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <SignaturePanel
              requests={allCurrentDocumentSignatureRequests}
              selectedRequestId={selectedSignatureRequestId}
              selectedRequest={selectedSignatureRequest}
              onSelectRequest={(requestId) => selectSignatureRequest(documentKey, requestId)}
              onCreateRequest={(input) => {
                if (!persistedDocumentId) {
                  setError("Attach a persisted document (docId) before signatures.");
                  return;
                }
                handleCreateSignatureRequest({
                  ...input,
                  documentId: persistedDocumentId,
                });
              }}
              onUpdateRequest={handleUpdateSignatureRequest}
              onSendRequest={handleSendSignatureRequest}
            />
          </aside>
        ) : null}
        {showFormsPanel ? (
          <aside className="min-h-0 border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <FormsPanel
              fields={allCurrentDocumentFormFields}
              selectedFieldId={selectedFormFieldId}
              currentPage={pageNumber}
              onSelectField={(fieldId) => selectFormField(documentKey, fieldId)}
              onAddField={handleCreateFormField}
              onDeleteField={handleDeleteFormField}
              onUpdateFieldName={(fieldId, name) => handleUpdateFormField(fieldId, { name })}
              onUpdateFieldValue={handleSubmitFormFieldValue}
              onSubmitField={(fieldId) => {
                const target = allCurrentDocumentFormFields.find((field) => field.id === fieldId);
                if (!target) {
                  return;
                }
                handleSubmitFormFieldValue(fieldId, String(target.value ?? ""));
              }}
            />
          </aside>
        ) : null}

        {isInitialLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-100/70 dark:bg-zinc-950/70">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading PDF…</p>
          </div>
        ) : null}

        {error ? (
          <div className="absolute inset-x-4 top-4 z-20 rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            Viewer error: {error}
          </div>
        ) : null}
      </div>
    </section>
  );
}
