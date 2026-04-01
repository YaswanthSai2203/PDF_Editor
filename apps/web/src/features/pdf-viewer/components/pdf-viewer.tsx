"use client";

import { useEffect, useMemo, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  LayoutTemplate,
  Type,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AnnotationToolbar } from "@/features/annotation/components/annotation-toolbar";
import type { AnnotationKind } from "@/features/annotation/domain/annotation";
import { useAnnotationStore } from "@/features/annotation/services/annotation-store";
import { PdfJsLoaderService } from "@/features/pdf-viewer/services/pdf-loader.service";

import { PdfCanvasPage } from "./pdf-canvas-page";
import { PdfThumbnail } from "./pdf-thumbnail";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.1;
const MAX_EAGER_PAGES = 30;

type FitMode = "width" | "page";

interface PdfViewerProps {
  sourceUrl: string;
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

export function PdfViewer({ sourceUrl }: PdfViewerProps) {
  const loader = useMemo(() => new PdfJsLoaderService(), []);
  const annotationsByDocument = useAnnotationStore(
    (state) => state.annotationsByDocument,
  );
  const selectedAnnotationId = useAnnotationStore(
    (state) => state.selectedAnnotationId,
  );
  const activeTool = useAnnotationStore((state) => state.activeTool);
  const setActiveTool = useAnnotationStore((state) => state.setActiveTool);
  const selectAnnotation = useAnnotationStore((state) => state.selectAnnotation);
  const createAnnotation = useAnnotationStore((state) => state.createAnnotation);
  const deleteAnnotation = useAnnotationStore((state) => state.deleteAnnotation);

  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<Record<number, PDFPageProxy>>({});
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [fitMode, setFitMode] = useState<FitMode>("width");
  const [showTextLayer, setShowTextLayer] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [thumbnailPages, setThumbnailPages] = useState<Record<number, PDFPageProxy>>(
    {},
  );

  useEffect(() => {
    let isCancelled = false;

    void loader
      .load({ sourceUrl })
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
  }, [loader, sourceUrl]);

  useEffect(() => {
    if (!pdfDocument) {
      return;
    }

    let isCancelled = false;
    const renderWindow = buildWindow(pageNumber, pdfDocument.numPages, 4);
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
    const thumbnailWindow = buildWindow(pageNumber, pdfDocument.numPages, 24).slice(
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
  const renderWindow = useMemo(
    () => buildWindow(pageNumber, totalPages, 4),
    [pageNumber, totalPages],
  );
  const thumbnailWindow = useMemo(
    () => buildWindow(pageNumber, totalPages, 24).slice(0, MAX_EAGER_PAGES),
    [pageNumber, totalPages],
  );

  const canGoBack = pageNumber > 1;
  const canGoForward = totalPages > 0 && pageNumber < totalPages;

  const zoomLabel = `${Math.round(scale * 100)}%`;
  const documentKey = sourceUrl;
  const allCurrentDocumentAnnotations =
    annotationsByDocument[documentKey] ?? [];
  const canDeleteSelection = allCurrentDocumentAnnotations.some(
    (item) => item.id === selectedAnnotationId,
  );

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

  function handleCreateAnnotation(
    targetPageNumber: number,
    kind: AnnotationKind,
    rect: { xPct: number; yPct: number; widthPct: number; heightPct: number },
  ) {
    createAnnotation({
      documentKey,
      pageNumber: targetPageNumber,
      kind,
      rect,
    });
  }

  function handleDeleteSelection() {
    if (!selectedAnnotationId) {
      return;
    }
    deleteAnnotation(documentKey, selectedAnnotationId);
  }

  return (
    <section className="flex h-full min-h-[70vh] flex-col overflow-hidden">
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

        <div className="flex items-center gap-2">
          <AnnotationToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            canDeleteSelection={canDeleteSelection}
            onDeleteSelection={handleDeleteSelection}
          />
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

      <div className="grid h-full min-h-0 grid-cols-1 bg-zinc-100 dark:bg-zinc-950/70 md:grid-cols-[220px_1fr]">
        <aside
          className={cn(
            "min-h-0 overflow-y-auto border-r border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900",
            !showThumbnails && "hidden md:hidden",
          )}
        >
          <div className="space-y-2">
            {thumbnailWindow.map((pageIndex) => (
              <PdfThumbnail
                key={`thumb-${pageIndex}`}
                page={thumbnailPages[pageIndex] ?? null}
                pageNumber={pageIndex}
                isActive={pageNumber === pageIndex}
                onClick={() => scrollToPage(pageIndex)}
              />
            ))}
            {totalPages > thumbnailWindow.length ? (
              <p className="px-2 py-1 text-xs text-zinc-500 dark:text-zinc-400">
                Virtualized thumbnails window around page {pageNumber} / {totalPages}.
              </p>
            ) : null}
          </div>
        </aside>

        <div className="min-h-0 overflow-auto p-4 md:p-6">
          <div className="mx-auto flex w-fit flex-col gap-4">
            {renderWindow.map((renderPageNumber) => (
              <div
                key={`page-${renderPageNumber}`}
                id={`pdf-page-${renderPageNumber}`}
                className="scroll-mt-24"
              >
                <div className="mb-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  Page {renderPageNumber}
                </div>
                <PdfCanvasPage
                  page={pages[renderPageNumber] ?? null}
                  pageNumber={renderPageNumber}
                  scale={fitMode === "page" ? Math.min(scale, 1.2) : scale}
                  onVisible={() => setPageNumber(renderPageNumber)}
                  showTextLayer={showTextLayer}
                  annotations={allCurrentDocumentAnnotations.filter(
                    (item) => item.pageNumber === renderPageNumber,
                  )}
                  selectedAnnotationId={selectedAnnotationId}
                  activeTool={activeTool}
                  onCreateAnnotation={handleCreateAnnotation}
                  onSelectAnnotation={selectAnnotation}
                />
              </div>
            ))}
          </div>
        </div>

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
