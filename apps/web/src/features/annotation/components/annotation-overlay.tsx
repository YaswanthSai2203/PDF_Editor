"use client";

import type { MouseEvent } from "react";

import { cn } from "@/lib/utils";
import type { AnnotationEntity, AnnotationKind } from "@/features/annotation/domain/annotation";

interface AnnotationOverlayProps {
  pageNumber: number;
  annotations: AnnotationEntity[];
  selectedAnnotationId: string | null;
  activeTool: "SELECT" | "HIGHLIGHT" | "NOTE";
  onCreateAnnotation: (
    pageNumber: number,
    kind: AnnotationKind,
    rect: { xPct: number; yPct: number; widthPct: number; heightPct: number },
  ) => void;
  onSelectAnnotation: (annotationId: string | null) => void;
}

function clampPct(input: number): number {
  return Math.min(100, Math.max(0, input));
}

export function AnnotationOverlay({
  pageNumber,
  annotations,
  selectedAnnotationId,
  activeTool,
  onCreateAnnotation,
  onSelectAnnotation,
}: AnnotationOverlayProps) {
  function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
    if (activeTool === "SELECT") {
      onSelectAnnotation(null);
      return;
    }

    const target = event.currentTarget;
    const bounds = target.getBoundingClientRect();

    const xPct = clampPct(((event.clientX - bounds.left) / bounds.width) * 100);
    const yPct = clampPct(((event.clientY - bounds.top) / bounds.height) * 100);

    onCreateAnnotation(
      pageNumber,
      activeTool === "NOTE" ? "NOTE" : "HIGHLIGHT",
      {
        xPct,
        yPct,
        widthPct: activeTool === "NOTE" ? 10 : 26,
        heightPct: activeTool === "NOTE" ? 8 : 5,
      },
    );
  }

  return (
    <div
      className={cn(
        "absolute inset-0 rounded",
        activeTool === "SELECT" ? "cursor-default" : "cursor-crosshair",
      )}
      onClick={handleOverlayClick}
      aria-label="Annotation overlay"
      role="presentation"
    >
      {annotations.map((annotation) => {
        const isSelected = annotation.id === selectedAnnotationId;
        return (
          <button
            key={annotation.id}
            type="button"
            className={cn(
              "absolute rounded border transition-all",
              isSelected
                ? "ring-2 ring-sky-500"
                : "hover:ring-1 hover:ring-zinc-400 dark:hover:ring-zinc-500",
              annotation.kind === "NOTE"
                ? "bg-sky-400/60 border-sky-500"
                : "bg-yellow-300/40 border-yellow-400",
            )}
            style={{
              left: `${annotation.rect.xPct}%`,
              top: `${annotation.rect.yPct}%`,
              width: `${annotation.rect.widthPct}%`,
              height: `${annotation.rect.heightPct}%`,
            }}
            onClick={(event) => {
              event.stopPropagation();
              onSelectAnnotation(annotation.id);
            }}
            aria-label={`Annotation ${annotation.id}`}
          />
        );
      })}
    </div>
  );
}
