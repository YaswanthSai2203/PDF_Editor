"use client";

import { useEffect, useRef } from "react";
import type { PDFPageProxy } from "pdfjs-dist";

import { cn } from "@/lib/utils";

interface PdfThumbnailProps {
  page: PDFPageProxy | null;
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
  rotationDeg?: number;
}

export function PdfThumbnail({
  page,
  pageNumber,
  isActive,
  onClick,
  rotationDeg = 0,
}: PdfThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!page || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const viewport = page.getViewport({ scale: 0.18 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const renderTask = page.render({ canvas, viewport, intent: "display" });
    void renderTask.promise.catch(() => {});

    return () => {
      renderTask.cancel();
    };
  }, [page]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col items-center gap-2 rounded-md border p-2 transition-colors",
        isActive
          ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
          : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800",
      )}
      aria-label={`Go to page ${pageNumber}`}
    >
      <canvas ref={canvasRef} className="rounded border border-zinc-200 dark:border-zinc-700" />
      <span className="text-xs text-zinc-600 dark:text-zinc-300">{pageNumber}</span>
      {rotationDeg !== 0 ? (
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
          {rotationDeg}°
        </span>
      ) : null}
    </button>
  );
}
