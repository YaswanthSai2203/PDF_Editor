"use client";

import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type PdfToolbarProps = {
  documentName: string;
  pageNumber: number;
  totalPages: number;
  scale: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
};

export function PdfToolbar({
  documentName,
  pageNumber,
  totalPages,
  scale,
  onPreviousPage,
  onNextPage,
  onZoomOut,
  onZoomIn,
}: PdfToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm backdrop-blur">
      <Badge variant="secondary">Viewer</Badge>
      <span className="max-w-48 truncate text-sm text-muted-foreground">
        {documentName}
      </span>
      <Separator orientation="vertical" className="hidden h-8 sm:block" />
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPreviousPage}
          disabled={pageNumber <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="min-w-24 text-center text-sm font-medium text-foreground">
          Page {pageNumber} / {totalPages}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNextPage}
          disabled={pageNumber >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <Separator orientation="vertical" className="hidden h-8 sm:block" />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onZoomOut} aria-label="Zoom out">
          <ZoomOut className="size-4" />
        </Button>
        <span className="min-w-16 text-center text-sm text-muted-foreground">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="ghost" size="icon" onClick={onZoomIn} aria-label="Zoom in">
          <ZoomIn className="size-4" />
        </Button>
      </div>
      <div className="ml-auto">
        <Button variant="outline" size="sm" asChild>
          <a href="/samples/contract-preview.pdf" download>
            <Download className="size-4" />
            Download sample
          </a>
        </Button>
      </div>
    </div>
  );
}
