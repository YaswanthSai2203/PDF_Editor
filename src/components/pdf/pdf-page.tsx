"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";
import { PDFService } from "@/lib/pdf/pdf-service";
import { cn } from "@/lib/utils";

interface PDFPageProps {
  document: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  rotation?: number;
  isActive?: boolean;
  onPageRendered?: (pageNumber: number, width: number, height: number) => void;
  className?: string;
}

/**
 * Renders a single PDF page.
 *
 * Design:
 * - Uses an IntersectionObserver so off-screen pages are not rendered
 *   (virtualization), but the container placeholder maintains layout height.
 * - Cancels in-flight render tasks on scale/rotation changes.
 * - Exposes rendered dimensions via callback for annotation layer sizing.
 */
export function PDFPage({
  document,
  pageNumber,
  scale,
  rotation = 0,
  isActive = false,
  onPageRendered,
  className,
}: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const pageRef = useRef<PDFPageProxy | null>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Observe visibility for lazy rendering
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: "200px 0px" } // pre-render 200px before entering viewport
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Load the page object
  useEffect(() => {
    let cancelled = false;
    document.getPage(pageNumber).then((page) => {
      if (!cancelled) {
        pageRef.current = page;
        // Pre-compute dimensions for layout
        const viewport = page.getViewport({ scale, rotation });
        setDimensions({ width: viewport.width, height: viewport.height });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [document, pageNumber, scale, rotation]);

  const renderPage = useCallback(async () => {
    const canvas = canvasRef.current;
    const page = pageRef.current;
    if (!canvas || !page) return;

    // Cancel any previous render
    if (renderTaskRef.current) {
      try {
        await renderTaskRef.current.cancel();
      } catch {
        // cancelled render throws — that's expected
      }
      renderTaskRef.current = null;
    }

    setIsRendering(true);
    setHasError(false);

    try {
      const task = await PDFService.renderPage(page, canvas, scale, rotation);
      renderTaskRef.current = task;
      await task.promise.catch((err: unknown) => {
        const name = (err as { name?: string })?.name;
        if (name !== "RenderingCancelledException") throw err;
      });

      const viewport = page.getViewport({ scale, rotation });
      setDimensions({ width: viewport.width, height: viewport.height });
      onPageRendered?.(pageNumber, viewport.width, viewport.height);
    } catch (err: unknown) {
      console.error(`Error rendering page ${pageNumber}:`, err);
      setHasError(true);
    } finally {
      setIsRendering(false);
    }
  }, [pageNumber, scale, rotation, onPageRendered]);

  // Trigger render when page is visible and parameters change
  useEffect(() => {
    if (isVisible && pageRef.current) {
      renderPage();
    }
  }, [isVisible, renderPage]);

  // Cleanup render task on unmount
  useEffect(() => {
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-page={pageNumber}
      className={cn(
        "relative mx-auto",
        isActive && "ring-2 ring-primary ring-offset-2 rounded-sm",
        className
      )}
      style={{
        width: dimensions.width || "auto",
        height: dimensions.height || "auto",
        minHeight: 200,
        minWidth: 150,
      }}
    >
      {/* Placeholder skeleton while not visible / loading */}
      {(!isVisible || isRendering) && !hasError && (
        <div
          className="absolute inset-0 bg-white animate-pulse"
          style={{ width: dimensions.width, height: dimensions.height }}
        />
      )}

      {/* Actual PDF canvas */}
      <canvas
        ref={canvasRef}
        className="pdf-page-canvas block"
        aria-label={`Page ${pageNumber}`}
      />

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded">
          <p className="text-sm text-muted-foreground">
            Failed to render page {pageNumber}
          </p>
        </div>
      )}
    </div>
  );
}
