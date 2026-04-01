"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PDFThumbnail } from "@/components/pdf/pdf-thumbnail";
import { useDocumentStore } from "@/stores/document.store";

interface PanelThumbnailsProps {
  document: PDFDocumentProxy;
}

export function PanelThumbnails({ document }: PanelThumbnailsProps) {
  const { currentPage, totalPages, actions } = useDocumentStore();

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Pages ({totalPages})
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col items-center gap-2 p-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <PDFThumbnail
              key={pageNum}
              document={document}
              pageNumber={pageNum}
              width={120}
              isActive={currentPage === pageNum}
              onClick={(p) => actions.setCurrentPage(p)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
