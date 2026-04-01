"use client";

import { useEffect, useRef } from "react";
import type { PDFPageProxy } from "pdfjs-dist";

interface PdfCanvasPageProps {
  page: PDFPageProxy | null;
  scale: number;
}

export function PdfCanvasPage({ page, scale }: PdfCanvasPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    <canvas
      ref={canvasRef}
      className="rounded border border-zinc-200 bg-white shadow-sm dark:border-zinc-800"
    />
  );
}
