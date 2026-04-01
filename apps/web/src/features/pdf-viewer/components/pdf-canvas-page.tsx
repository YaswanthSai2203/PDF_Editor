"use client";

import { useEffect, useRef } from "react";
import type { PDFPageProxy } from "pdfjs-dist";

import { EditorOverlay } from "@/features/editor/components/editor-overlay";
import type {
  EditorElementEntity,
  EditorElementRect,
  EditorTool,
} from "@/features/editor/domain/editor-element";

interface PdfCanvasPageProps {
  page: PDFPageProxy | null;
  pageNumber: number;
  scale: number;
  rotationDeg?: number;
  className?: string;
  onVisible?: () => void;
  showTextLayer?: boolean;
  interactionMode?: "annotate" | "edit";
  editorElements?: EditorElementEntity[];
  selectedEditorElementId?: string | null;
  activeEditorTool?: EditorTool;
  imageDraftUrl?: string;
  onCreateEditorElement?: (
    pageNumber: number,
    kind: "TEXT" | "IMAGE",
    rect: EditorElementRect,
    value?: string,
  ) => void;
  onSelectEditorElement?: (elementId: string | null) => void;
  onUpdateEditorElementRect?: (elementId: string, rect: EditorElementRect) => void;
  onUpdateEditorElementValue?: (elementId: string, value: string) => void;
}

export function PdfCanvasPage({
  page,
  pageNumber,
  scale,
  rotationDeg = 0,
  className,
  onVisible,
  showTextLayer = false,
  interactionMode = "annotate",
  editorElements = [],
  selectedEditorElementId = null,
  activeEditorTool = "SELECT",
  imageDraftUrl = "",
  onCreateEditorElement,
  onSelectEditorElement,
  onUpdateEditorElementRect,
  onUpdateEditorElementValue,
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

    const viewport = page.getViewport({ scale, rotation: rotationDeg });
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
  }, [page, scale, rotationDeg]);

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
        {interactionMode === "edit" &&
        onCreateEditorElement &&
        onSelectEditorElement &&
        onUpdateEditorElementRect &&
        onUpdateEditorElementValue ? (
          <EditorOverlay
            pageNumber={pageNumber}
            elements={editorElements}
            selectedElementId={selectedEditorElementId}
            activeTool={activeEditorTool}
            imageDraftUrl={imageDraftUrl}
            onCreateElement={onCreateEditorElement}
            onSelectElement={onSelectEditorElement}
            onUpdateElementRect={onUpdateEditorElementRect}
            onUpdateElementTextContent={onUpdateEditorElementValue}
            onSelectImageFile={() => {
              // Image picking is handled in the toolbar on this phase.
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
