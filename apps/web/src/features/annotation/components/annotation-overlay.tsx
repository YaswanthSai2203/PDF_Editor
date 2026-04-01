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
  onUpdateAnnotationRect: (
    annotationId: string,
    rect: { xPct: number; yPct: number; widthPct: number; heightPct: number },
  ) => void;
  onUpdateAnnotationNoteText: (annotationId: string, noteText: string) => void;
}

function clampPct(input: number): number {
  return Math.min(100, Math.max(0, input));
}

function getOverlayBounds(startElement: HTMLElement): DOMRect | null {
  const overlay = startElement.closest("[data-annotation-overlay='true']");
  if (!overlay) {
    return null;
  }
  return overlay.getBoundingClientRect();
}

function toPct(deltaPx: number, totalPx: number): number {
  return (deltaPx / totalPx) * 100;
}

export function AnnotationOverlay({
  pageNumber,
  annotations,
  selectedAnnotationId,
  activeTool,
  onCreateAnnotation,
  onSelectAnnotation,
  onUpdateAnnotationRect,
  onUpdateAnnotationNoteText,
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
      data-annotation-overlay="true"
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
            onMouseDown={(event) => {
              if (activeTool !== "SELECT") {
                return;
              }

              event.preventDefault();
              event.stopPropagation();
              const bounds = getOverlayBounds(event.currentTarget);
              if (!bounds) {
                return;
              }
              const startX = event.clientX;
              const startY = event.clientY;
              const startRect = annotation.rect;

              const overlayWidth = bounds.width;
              const overlayHeight = bounds.height;

              function handleMove(moveEvent: globalThis.MouseEvent) {
                const deltaXPct = toPct(moveEvent.clientX - startX, overlayWidth);
                const deltaYPct = toPct(moveEvent.clientY - startY, overlayHeight);
                onUpdateAnnotationRect(annotation.id, {
                  xPct: clampPct(startRect.xPct + deltaXPct),
                  yPct: clampPct(startRect.yPct + deltaYPct),
                  widthPct: startRect.widthPct,
                  heightPct: startRect.heightPct,
                });
              }

              function handleUp() {
                window.removeEventListener("mousemove", handleMove);
                window.removeEventListener("mouseup", handleUp);
              }

              window.addEventListener("mousemove", handleMove);
              window.addEventListener("mouseup", handleUp);
            }}
            aria-label={`Annotation ${annotation.id}`}
          >
            {isSelected ? (
              <>
                <span
                  className="absolute right-[-5px] bottom-[-5px] h-2.5 w-2.5 rounded-full border border-white bg-zinc-700"
                  onMouseDown={(event) => {
                    if (activeTool !== "SELECT") {
                      return;
                    }

                    event.preventDefault();
                    event.stopPropagation();
                    const bounds = getOverlayBounds(event.currentTarget);
                    if (!bounds) {
                      return;
                    }
                    const startX = event.clientX;
                    const startY = event.clientY;
                    const startRect = annotation.rect;

                    const overlayWidth = bounds.width;
                    const overlayHeight = bounds.height;

                    function handleMove(moveEvent: globalThis.MouseEvent) {
                      const deltaXPct = toPct(moveEvent.clientX - startX, overlayWidth);
                      const deltaYPct = toPct(moveEvent.clientY - startY, overlayHeight);
                      onUpdateAnnotationRect(annotation.id, {
                        xPct: startRect.xPct,
                        yPct: startRect.yPct,
                        widthPct: clampPct(Math.max(2, startRect.widthPct + deltaXPct)),
                        heightPct: clampPct(Math.max(2, startRect.heightPct + deltaYPct)),
                      });
                    }

                    function handleUp() {
                      window.removeEventListener("mousemove", handleMove);
                      window.removeEventListener("mouseup", handleUp);
                    }

                    window.addEventListener("mousemove", handleMove);
                    window.addEventListener("mouseup", handleUp);
                  }}
                />
                {annotation.kind === "NOTE" ? (
                  <textarea
                    className="absolute inset-0 resize-none rounded bg-sky-100/80 p-1 text-[10px] text-zinc-900 outline-none"
                    value={annotation.noteText ?? ""}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      onUpdateAnnotationNoteText(annotation.id, event.target.value)
                    }
                    aria-label="Edit note annotation text"
                  />
                ) : null}
              </>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
