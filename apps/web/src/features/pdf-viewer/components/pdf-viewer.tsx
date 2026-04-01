"use client";

import { useEffect, useMemo, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  GripVertical,
  Image as ImageIcon,
  Link2,
  LayoutTemplate,
  RotateCcw,
  RotateCw,
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
          showOrganizerPanel
            ? "md:grid-cols-[220px_1fr_320px]"
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
