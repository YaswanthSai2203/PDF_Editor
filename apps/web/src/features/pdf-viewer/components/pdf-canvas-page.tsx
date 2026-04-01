"use client";

import { useEffect, useRef } from "react";
import type { PDFPageProxy } from "pdfjs-dist";

import {
  AnnotationOverlay,
} from "@/features/annotation/components/annotation-overlay";
import type { AnnotationEntity } from "@/features/annotation/domain/annotation";
import type { AnnotationKind } from "@/features/annotation/domain/annotation";

interface PdfCanvasPageProps {
  page: PDFPageProxy | null;
  pageNumber: number;
  scale: number;
  className?: string;
  onVisible?: () => void;
  showTextLayer?: boolean;
  annotations?: AnnotationEntity[];
  selectedAnnotationId?: string | null;
  activeTool?: "SELECT" | "HIGHLIGHT" | "NOTE";
  onCreateAnnotation?: (
    pageNumber: number,
    kind: AnnotationKind,
    rect: { xPct: number; yPct: number; widthPct: number; heightPct: number },
  ) => void;
  onSelectAnnotation?: (annotationId: string | null) => void;
}

export function PdfCanvasPage({
  page,
  pageNumber,
  scale,
  className,
  onVisible,
  showTextLayer = false,
  annotations = [],
  selectedAnnotationId = null,
  activeTool = "SELECT",
  onCreateAnnotation,
  onSelectAnnotation,
}: PdfCanvasPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!onVisible || !containerRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onVisible();
          }
        }
      },
      { rootMargin: "200px 0px", threshold: 0.25 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [onVisible]);

  useEffect(() => {
    if (!page || !canvasRef.current) {
      return;
    }

    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    if (textLayerRef.current) {
      textLayerRef.current.style.width = `${viewport.width}px`;
      textLayerRef.current.style.height = `${viewport.height}px`;
    }

    const renderTask = page.render({
      canvas,
      viewport,
      intent: "display",
    });

    void renderTask.promise.catch(() => {
      // Rendering may be cancelled during rapid zoom/page changes.
    });

    return () => {
      renderTask.cancel();
    };
  }, [page, scale]);

  return (
    <div ref={containerRef} className={className}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="rounded border border-zinc-200 bg-white shadow-sm dark:border-zinc-800"
        />
        {showTextLayer ? (
          <div
            ref={textLayerRef}
            className="pointer-events-none absolute inset-0 rounded bg-transparent"
            aria-hidden="true"
          />
        ) : null}
        {onCreateAnnotation && onSelectAnnotation ? (
          <AnnotationOverlay
            pageNumber={pageNumber}
            annotations={annotations}
            selectedAnnotationId={selectedAnnotationId}
            activeTool={activeTool}
            onCreateAnnotation={onCreateAnnotation}
            onSelectAnnotation={onSelectAnnotation}
          />
        ) : null}
      </div>
    </div>
  );
}
