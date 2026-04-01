"use client";

import Image from "next/image";
import type { MouseEvent } from "react";
import { Image as ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  EditorElementEntity,
  EditorElementKind,
  EditorElementRect,
} from "@/features/editor/domain/editor-element";

interface EditorOverlayProps {
  pageNumber: number;
  elements: EditorElementEntity[];
  selectedElementId: string | null;
  activeTool: "SELECT" | "TEXT" | "IMAGE";
  imageDraftUrl?: string;
  onCreateElement: (
    pageNumber: number,
    kind: EditorElementKind,
    rect: EditorElementRect,
    value?: string,
  ) => void;
  onSelectElement: (elementId: string | null) => void;
  onUpdateElementRect: (elementId: string, rect: EditorElementRect) => void;
  onUpdateElementTextContent: (elementId: string, value: string) => void;
  onSelectImageFile: () => void;
}

function clampPct(input: number): number {
  return Math.min(100, Math.max(0, input));
}

function toPct(deltaPx: number, totalPx: number): number {
  return (deltaPx / totalPx) * 100;
}

function getOverlayBounds(startElement: HTMLElement): DOMRect | null {
  const overlay = startElement.closest("[data-editor-overlay='true']");
  if (!overlay) {
    return null;
  }
  return overlay.getBoundingClientRect();
}

function getElementLabel(kind: EditorElementKind): string {
  return kind === "TEXT" ? "Text element" : "Image element";
}

export function EditorOverlay({
  pageNumber,
  elements,
  selectedElementId,
  activeTool,
  imageDraftUrl,
  onCreateElement,
  onSelectElement,
  onUpdateElementRect,
  onUpdateElementTextContent,
  onSelectImageFile,
}: EditorOverlayProps) {
  function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
    if (activeTool === "SELECT") {
      onSelectElement(null);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const xPct = clampPct(((event.clientX - bounds.left) / bounds.width) * 100);
    const yPct = clampPct(((event.clientY - bounds.top) / bounds.height) * 100);

    if (activeTool === "TEXT") {
      onCreateElement(
        pageNumber,
        "TEXT",
        {
          xPct,
          yPct,
          widthPct: 24,
          heightPct: 8,
        },
        "Double-click to edit text",
      );
      return;
    }

    if (imageDraftUrl) {
      onCreateElement(
        pageNumber,
        "IMAGE",
        {
          xPct,
          yPct,
          widthPct: 28,
          heightPct: 20,
        },
        imageDraftUrl,
      );
      return;
    }

    onSelectImageFile();
  }

  return (
    <div
      data-editor-overlay="true"
      className={cn(
        "absolute inset-0 rounded",
        activeTool === "SELECT" ? "cursor-default" : "cursor-crosshair",
      )}
      onClick={handleOverlayClick}
      aria-label="Editor overlay"
      role="presentation"
    >
      {elements.map((element) => {
        const isSelected = element.id === selectedElementId;
        return (
          <div
            key={element.id}
            role="button"
            tabIndex={0}
            className={cn(
              "absolute overflow-hidden rounded border transition-all",
              isSelected
                ? "ring-2 ring-emerald-500"
                : "hover:ring-1 hover:ring-zinc-400 dark:hover:ring-zinc-500",
              element.kind === "TEXT"
                ? "border-emerald-500/70 bg-emerald-100/65"
                : "border-indigo-500/70 bg-indigo-100/35",
            )}
            style={{
              left: `${element.rect.xPct}%`,
              top: `${element.rect.yPct}%`,
              width: `${element.rect.widthPct}%`,
              height: `${element.rect.heightPct}%`,
            }}
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              onSelectElement(element.id);
            }}
            onKeyDown={(keyEvent) => {
              if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                keyEvent.preventDefault();
                onSelectElement(element.id);
              }
            }}
            onMouseDown={(dragStartEvent) => {
              if (activeTool !== "SELECT") {
                return;
              }
              if (
                dragStartEvent.target instanceof HTMLElement &&
                dragStartEvent.target.dataset.resizeHandle === "true"
              ) {
                return;
              }

              dragStartEvent.preventDefault();
              dragStartEvent.stopPropagation();

              const bounds = getOverlayBounds(dragStartEvent.currentTarget);
              if (!bounds) {
                return;
              }

              const startX = dragStartEvent.clientX;
              const startY = dragStartEvent.clientY;
              const startRect = element.rect;
              const overlayWidth = bounds.width;
              const overlayHeight = bounds.height;

              function handleMove(moveEvent: globalThis.MouseEvent) {
                const deltaXPct = toPct(moveEvent.clientX - startX, overlayWidth);
                const deltaYPct = toPct(moveEvent.clientY - startY, overlayHeight);

                onUpdateElementRect(element.id, {
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
            aria-label={getElementLabel(element.kind)}
          >
            {element.kind === "TEXT" ? (
              <textarea
                className={cn(
                  "h-full w-full resize-none border-none bg-transparent p-1 text-[11px] text-zinc-900 outline-none",
                  !isSelected && "pointer-events-none",
                )}
                value={element.textContent ?? ""}
                onDoubleClick={(dblClickEvent) => {
                  dblClickEvent.stopPropagation();
                  onSelectElement(element.id);
                }}
                onClick={(textClickEvent) => textClickEvent.stopPropagation()}
                onChange={(changeEvent) =>
                  onUpdateElementTextContent(element.id, changeEvent.target.value)
                }
                aria-label="Edit text element content"
              />
            ) : element.imageSrc ? (
              <Image
                src={element.imageSrc}
                alt="Inserted element"
                fill
                className="object-contain"
                unoptimized
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-indigo-600">
                <ImageIcon className="h-4 w-4" />
              </div>
            )}

            {isSelected ? (
              <span
                data-resize-handle="true"
                className="absolute right-[-5px] bottom-[-5px] h-2.5 w-2.5 rounded-full border border-white bg-zinc-800"
                onMouseDown={(resizeStartEvent) => {
                  if (activeTool !== "SELECT") {
                    return;
                  }

                  resizeStartEvent.preventDefault();
                  resizeStartEvent.stopPropagation();

                  const bounds = getOverlayBounds(resizeStartEvent.currentTarget);
                  if (!bounds) {
                    return;
                  }

                  const startX = resizeStartEvent.clientX;
                  const startY = resizeStartEvent.clientY;
                  const startRect = element.rect;
                  const overlayWidth = bounds.width;
                  const overlayHeight = bounds.height;

                  function handleMove(moveEvent: globalThis.MouseEvent) {
                    const deltaXPct = toPct(moveEvent.clientX - startX, overlayWidth);
                    const deltaYPct = toPct(moveEvent.clientY - startY, overlayHeight);

                    onUpdateElementRect(element.id, {
                      xPct: startRect.xPct,
                      yPct: startRect.yPct,
                      widthPct: clampPct(Math.max(4, startRect.widthPct + deltaXPct)),
                      heightPct: clampPct(Math.max(3, startRect.heightPct + deltaYPct)),
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
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
