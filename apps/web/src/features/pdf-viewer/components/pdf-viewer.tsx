"use client";

import { useEffect, useMemo, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PdfJsLoaderService } from "@/features/pdf-viewer/services/pdf-loader.service";

import { PdfCanvasPage } from "./pdf-canvas-page";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.1;

interface PdfViewerProps {
  sourceUrl: string;
}

export function PdfViewer({ sourceUrl }: PdfViewerProps) {
  const loader = useMemo(() => new PdfJsLoaderService(), []);

  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState<PDFPageProxy | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;
    const initialPage = 1;

    void loader
      .load({ sourceUrl })
      .then((pdfDoc) => {
        if (isCancelled) {
          return;
        }

        setError(null);
        setDocument(pdfDoc);
        setPageNumber(initialPage);
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
    if (!document) {
      return;
    }

    let isCancelled = false;

    void document
      .getPage(pageNumber)
      .then((pdfPage) => {
        if (!isCancelled) {
          setPage(pdfPage);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError("Unable to render requested page.");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [document, pageNumber]);

  const totalPages = document?.numPages ?? 0;

  const canGoBack = pageNumber > 1;
  const canGoForward = totalPages > 0 && pageNumber < totalPages;

  const zoomLabel = `${Math.round(scale * 100)}%`;

  return (
    <section className="flex h-full min-h-[70vh] flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
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
                setPageNumber(Math.max(1, parsed));
                return;
              }

              setPageNumber(Math.max(1, Math.min(parsed, totalPages)));
            }}
            aria-label="Current page number"
          />

          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            / {totalPages || "–"}
          </span>

          <Button
            size="icon"
            variant="outline"
            onClick={() =>
              setPageNumber((current) => Math.min(totalPages, current + 1))
            }
            disabled={!canGoForward}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
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
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto bg-zinc-100 p-6 dark:bg-zinc-950/70">
        {isInitialLoading ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading PDF…</p>
        ) : null}

        {error ? (
          <div className="rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        ) : null}

        {!isInitialLoading && !error ? (
          <PdfCanvasPage page={page} scale={scale} />
        ) : null}
      </div>
    </section>
  );
}
