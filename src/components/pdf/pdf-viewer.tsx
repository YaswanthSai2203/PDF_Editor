"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Loader2, AlertTriangle } from "lucide-react";
import { usePDF } from "@/hooks/use-pdf";
import { PDFPage } from "./pdf-page";
import { AnnotationLayer } from "@/components/annotations/annotation-layer";
import { useDocumentStore } from "@/stores/document.store";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";

interface PDFViewerProps {
  documentId: string;
  url: string;
  userId: string;
  onDocumentLoaded?: (doc: PDFDocumentProxy) => void;
}

/**
 * PDFViewer — the central viewing and annotation canvas.
 *
 * Architecture:
 * - Scrolls vertically through all pages (continuous scroll mode)
 * - Each page has a PDFPage component (canvas) overlaid by an AnnotationLayer (SVG+canvas)
 * - Uses IntersectionObserver-based virtualization inside PDFPage
 * - The active page is tracked by which page is closest to center viewport
 * - Scale / rotation come from the document store, driven by toolbar controls
 */
export function PDFViewer({
  documentId,
  url,
  userId,
  onDocumentLoaded,
}: PDFViewerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { scale, rotation, currentPage, actions: docActions } = useDocumentStore();
  const { sidebarPanel } = useUIStore();

  const { document, numPages, isLoading, error } = usePDF({
    url,
    scale,
  });

  // Page dimensions cache: { [pageNum]: { width, height } }
  const [pageDimensions, setPageDimensions] = useState<
    Record<number, { width: number; height: number }>
  >({});

  // Notify parent once loaded
  useEffect(() => {
    if (document) {
      onDocumentLoaded?.(document);
      docActions.setTotalPages(numPages);
    }
  }, [document, numPages, onDocumentLoaded, docActions]);

  const handlePageRendered = useCallback(
    (pageNumber: number, width: number, height: number) => {
      setPageDimensions((prev) => ({ ...prev, [pageNumber]: { width, height } }));
    },
    []
  );

  // Track current page by scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const containerMid = container.scrollTop + container.clientHeight / 2;
      const pageEls = container.querySelectorAll<HTMLElement>("[data-page]");
      let closestPage = 1;
      let closestDist = Infinity;

      pageEls.forEach((el) => {
        const pageNum = Number(el.dataset.page);
        const elMid = el.offsetTop + el.offsetHeight / 2;
        const dist = Math.abs(containerMid - elMid);
        if (dist < closestDist) {
          closestDist = dist;
          closestPage = pageNum;
        }
      });

      docActions.setCurrentPage(closestPage);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [docActions]);

  // Scroll to page when currentPage changes (e.g. from thumbnail click)
  const lastScrolledPageRef = useRef<number>(0);
  useEffect(() => {
    if (lastScrolledPageRef.current === currentPage) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const target = container.querySelector<HTMLElement>(
      `[data-page="${currentPage}"]`
    );
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      lastScrolledPageRef.current = currentPage;
    }
  }, [currentPage]);

  // ── Loading state ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading document…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 max-w-sm text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm font-medium">Failed to load PDF</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!document) return null;

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "flex-1 overflow-y-auto overflow-x-auto",
        "bg-[hsl(var(--editor-bg))]"
      )}
      style={{ scrollBehavior: "auto" }}
    >
      {/* All pages stacked vertically */}
      <div className="flex flex-col items-center gap-6 py-6 px-4 min-h-full">
        {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => {
          const dims = pageDimensions[pageNumber];
          return (
            <div
              key={pageNumber}
              className="relative shadow-xl"
            >
              <PDFPage
                document={document}
                pageNumber={pageNumber}
                scale={scale}
                rotation={rotation}
                isActive={currentPage === pageNumber}
                onPageRendered={handlePageRendered}
              />

              {/* Annotation layer — positioned exactly over the page canvas */}
              {dims && (
                <AnnotationLayer
                  documentId={documentId}
                  pageNumber={pageNumber}
                  pageWidth={dims.width}
                  pageHeight={dims.height}
                  scale={scale}
                  userId={userId}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
