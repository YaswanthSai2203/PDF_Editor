"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { PDFService } from "@/lib/pdf/pdf-service";
import { cn } from "@/lib/utils";

interface PDFThumbnailProps {
  document: PDFDocumentProxy;
  pageNumber: number;
  width?: number;
  isActive?: boolean;
  onClick?: (pageNumber: number) => void;
}

export function PDFThumbnail({
  document,
  pageNumber,
  width = 120,
  isActive,
  onClick,
}: PDFThumbnailProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setIsLoading(true);
    setDataUrl(null);

    PDFService.renderThumbnail(document, pageNumber, width)
      .then((url) => {
        if (mountedRef.current) {
          setDataUrl(url);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mountedRef.current) setIsLoading(false);
      });

    return () => {
      mountedRef.current = false;
    };
  }, [document, pageNumber, width]);

  return (
    <button
      onClick={() => onClick?.(pageNumber)}
      className={cn(
        "group flex flex-col items-center gap-1 p-1.5 rounded-md hover:bg-accent/50 transition-colors w-full",
        isActive && "bg-accent"
      )}
      aria-label={`Go to page ${pageNumber}`}
      aria-current={isActive ? "true" : undefined}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded border bg-white shadow-sm transition-all",
          isActive
            ? "border-primary shadow-md"
            : "border-border group-hover:border-primary/50"
        )}
        style={{ width, aspectRatio: "1 / 1.414" }}
      >
        {isLoading ? (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        ) : dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={`Page ${pageNumber} thumbnail`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <span className="text-xs text-muted-foreground">{pageNumber}</span>
          </div>
        )}
      </div>
      <span
        className={cn(
          "text-[10px] font-medium",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        {pageNumber}
      </span>
    </button>
  );
}
