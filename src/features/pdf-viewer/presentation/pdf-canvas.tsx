"use client";

import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import type { PdfPageViewport } from "@/features/pdf-viewer/domain/pdf-document";
import { loadPdfDocument, renderPdfPage } from "@/features/pdf-viewer/infrastructure/pdfjs/pdfjs-client";
import { cn } from "@/lib/utils";

type PdfCanvasProps = {
  fileUrl: string;
  pageNumber: number;
  scale: number;
  className?: string;
  onViewportChange?: (viewport: PdfPageViewport) => void;
};

type RenderState = "idle" | "loading" | "ready" | "error";

export function PdfCanvas({
  fileUrl,
  pageNumber,
  scale,
  className,
  onViewportChange,
}: PdfCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<RenderState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    async function renderPage() {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      setState("loading");
      setErrorMessage(null);

      try {
        const pdf = await loadPdfDocument(fileUrl);
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });

        await renderPdfPage(page, canvas, scale);

        if (disposed) {
          return;
        }

        onViewportChange?.({
          width: viewport.width,
          height: viewport.height,
          scale,
        });
        setState("ready");
      } catch (error) {
        if (disposed) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Unable to render the PDF page.";
        setErrorMessage(message);
        setState("error");
      }
    }

    void renderPage();

    return () => {
      disposed = true;
    };
  }, [fileUrl, onViewportChange, pageNumber, scale]);

  return (
    <div
      className={cn(
        "relative flex min-h-[480px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-background shadow-sm",
        className,
      )}
    >
      {(state === "loading" || state === "idle") && (
        <Badge
          variant="secondary"
          className="absolute left-4 top-4 bg-background/90 backdrop-blur"
        >
          Rendering page {pageNumber}
        </Badge>
      )}

      {state === "error" ? (
        <div className="flex max-w-sm flex-col items-center gap-2 p-8 text-center">
          <p className="text-sm font-semibold text-foreground">
            Failed to render the document preview
          </p>
          <p className="text-sm text-muted-foreground">
            {errorMessage ?? "The viewer encountered an unknown error."}
          </p>
        </div>
      ) : (
        <canvas ref={canvasRef} className="max-w-full" />
      )}
    </div>
  );
}
