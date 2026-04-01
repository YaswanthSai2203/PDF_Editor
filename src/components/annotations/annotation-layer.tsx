"use client";

import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAnnotationStore } from "@/stores/annotation.store";
import { generateId } from "@/lib/utils";
import type {
  Annotation,
  AnnotationPoint,
  FreehandAnnotationData,
  HighlightAnnotationData,
  ShapeAnnotationData,
  TextAnnotationData,
} from "@/types/annotation";
import { AnnotationRenderer } from "./annotation-renderer";

interface AnnotationLayerProps {
  documentId: string;
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  scale: number;
  userId: string;
}

/**
 * AnnotationLayer renders on top of the PDF canvas.
 *
 * Architecture:
 * - The SVG layer handles highlight / text / shape annotations (resolution-independent)
 * - A canvas layer handles freehand drawing (performance)
 * - Both share the same coordinate space as the rendered PDF page
 *
 * Coordinate system: everything stored in the Zustand store is in
 * unscaled PDF units (scale=1). We apply `scale` only at render time.
 * This means saved annotations look correct at any zoom level.
 */
export function AnnotationLayer({
  documentId,
  pageNumber,
  pageWidth,
  pageHeight,
  scale,
  userId,
}: AnnotationLayerProps) {
  const { activeTool, toolSettings, annotations, actions } = useAnnotationStore();
  const isInteractive = activeTool !== "SELECT" && activeTool !== "PAN";

  // Freehand drawing state
  const freehandCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<AnnotationPoint[]>([]);

  // Convert mouse/touch coords relative to the layer div into PDF units
  const toDocCoords = useCallback(
    (e: React.MouseEvent<HTMLElement> | MouseEvent): AnnotationPoint => {
      const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect?.() ??
        freehandCanvasRef.current!.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale,
      };
    },
    [scale]
  );

  // Page annotations filtered to this page
  const pageAnnotations = actions.getAnnotationsForPage(pageNumber);

  // ── Freehand drawing ───────────────────────────────────────────────────────

  const startFreehand = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (activeTool !== "FREEHAND") return;
      isDrawingRef.current = true;
      currentPointsRef.current = [toDocCoords(e)];
      actions.setIsDrawing(true);
    },
    [activeTool, toDocCoords, actions]
  );

  const continueFreehand = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDrawingRef.current || activeTool !== "FREEHAND") return;
      const point = toDocCoords(e);
      currentPointsRef.current.push(point);

      // Draw live stroke on the freehand canvas
      const canvas = freehandCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const pts = currentPointsRef.current;
      if (pts.length < 2) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(scale, scale);
      ctx.beginPath();
      ctx.strokeStyle = toolSettings.color;
      ctx.globalAlpha = toolSettings.opacity;
      ctx.lineWidth = toolSettings.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const mid = {
          x: (pts[i - 1].x + pts[i].x) / 2,
          y: (pts[i - 1].y + pts[i].y) / 2,
        };
        ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, mid.x, mid.y);
      }
      ctx.stroke();
      ctx.restore();
    },
    [activeTool, toDocCoords, toolSettings, scale]
  );

  const endFreehand = useCallback(() => {
    if (!isDrawingRef.current || activeTool !== "FREEHAND") return;
    isDrawingRef.current = false;
    actions.setIsDrawing(false);

    const points = currentPointsRef.current;
    if (points.length < 2) return;

    // Commit to store
    const data: FreehandAnnotationData = {
      points,
      color: toolSettings.color,
      opacity: toolSettings.opacity,
      strokeWidth: toolSettings.strokeWidth,
    };

    const annotation: Annotation = {
      id: generateId(),
      documentId,
      userId,
      page: pageNumber,
      type: "FREEHAND",
      data,
      isResolved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    actions.addAnnotation(annotation);
    currentPointsRef.current = [];

    // Clear live canvas (the committed annotation renders via SVG)
    const canvas = freehandCanvasRef.current;
    if (canvas) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [activeTool, documentId, pageNumber, userId, toolSettings, actions]);

  // ── Mouse down handler for shape/highlight annotations ────────────────────

  const startRef = useRef<AnnotationPoint | null>(null);
  // Placeholder for future live-preview annotation state
  const previewAnnotationRef = useRef<Annotation | null>(null);
  void previewAnnotationRef;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (activeTool === "SELECT" || activeTool === "PAN") return;
      e.preventDefault();

      if (activeTool === "FREEHAND") {
        startFreehand(e);
        return;
      }

      startRef.current = toDocCoords(e);
    },
    [activeTool, toDocCoords, startFreehand]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (activeTool === "FREEHAND") {
        endFreehand();
        return;
      }

      if (!startRef.current) return;
      const end = toDocCoords(e);
      const start = startRef.current;
      startRef.current = null;

      const rect = {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
      };

      // Skip tiny accidental clicks
      if (rect.width < 3 && rect.height < 3) return;

      let annotation: Annotation | null = null;

      if (
        activeTool === "RECTANGLE" ||
        activeTool === "ELLIPSE" ||
        activeTool === "LINE" ||
        activeTool === "ARROW"
      ) {
        const data: ShapeAnnotationData = {
          rect,
          color: toolSettings.color,
          opacity: toolSettings.opacity,
          strokeWidth: toolSettings.strokeWidth,
        };
        annotation = {
          id: generateId(),
          documentId,
          userId,
          page: pageNumber,
          type: activeTool,
          data,
          isResolved: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else if (activeTool === "HIGHLIGHT" || activeTool === "UNDERLINE" || activeTool === "STRIKETHROUGH") {
        const data: HighlightAnnotationData = {
          rects: [rect],
          color: toolSettings.color,
          opacity: toolSettings.opacity,
        };
        annotation = {
          id: generateId(),
          documentId,
          userId,
          page: pageNumber,
          type: activeTool,
          data,
          isResolved: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else if (activeTool === "TEXT") {
        const data: TextAnnotationData = {
          rect,
          content: "Text",
          color: toolSettings.color,
          opacity: 1,
          fontSize: toolSettings.fontSize,
          fontFamily: toolSettings.fontFamily,
        };
        annotation = {
          id: generateId(),
          documentId,
          userId,
          page: pageNumber,
          type: "TEXT",
          data,
          isResolved: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      if (annotation) {
        actions.addAnnotation(annotation);
      }
    },
    [activeTool, endFreehand, toDocCoords, toolSettings, documentId, userId, pageNumber, actions]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (activeTool === "FREEHAND") {
        continueFreehand(e);
      }
    },
    [activeTool, continueFreehand]
  );

  // Size the freehand canvas to match the page
  useEffect(() => {
    const canvas = freehandCanvasRef.current;
    if (!canvas) return;
    canvas.width = pageWidth;
    canvas.height = pageHeight;
  }, [pageWidth, pageHeight]);

  const cursorClass = {
    SELECT: "cursor-default",
    PAN: "cursor-grab active:cursor-grabbing",
    HIGHLIGHT: "cursor-crosshair",
    UNDERLINE: "cursor-crosshair",
    STRIKETHROUGH: "cursor-crosshair",
    RECTANGLE: "cursor-crosshair",
    ELLIPSE: "cursor-crosshair",
    LINE: "cursor-crosshair",
    ARROW: "cursor-crosshair",
    FREEHAND: "cursor-crosshair",
    TEXT: "cursor-text",
    COMMENT: "cursor-pointer",
    STAMP: "cursor-pointer",
    IMAGE: "cursor-crosshair",
    ERASER: "cursor-cell",
    SIGNATURE: "cursor-pointer",
  }[activeTool] ?? "cursor-default";

  return (
    <div
      className={cn(
        "annotation-layer",
        isInteractive && "active",
        cursorClass
      )}
      style={{ width: pageWidth, height: pageHeight }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={endFreehand}
    >
      {/* SVG layer for committed annotations */}
      <svg
        className="absolute inset-0 overflow-visible"
        width={pageWidth}
        height={pageHeight}
        style={{ pointerEvents: isInteractive ? "none" : "all" }}
      >
        {pageAnnotations.map((annotation) => (
          <AnnotationRenderer
            key={annotation.id}
            annotation={annotation}
            scale={scale}
            isSelected={false}
            onSelect={() => actions.selectAnnotation(annotation.id)}
          />
        ))}
      </svg>

      {/* Canvas for live freehand strokes */}
      <canvas
        ref={freehandCanvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ width: pageWidth, height: pageHeight }}
      />
    </div>
  );
}
