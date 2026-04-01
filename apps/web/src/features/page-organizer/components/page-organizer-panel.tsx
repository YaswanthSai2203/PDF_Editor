"use client";

import { GripVertical, Redo2, RotateCw, Trash2, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PageOperationEntity } from "@/features/page-organizer/domain/page-organizer";

interface PageOrganizerPanelProps {
  totalPages: number;
  orderedPages: number[];
  activePage: number;
  rotationByOriginalPage: Record<number, number>;
  canUndo: boolean;
  canRedo: boolean;
  onSelectPage: (originalPage: number) => void;
  onMovePage: (fromOriginalPage: number, toOriginalPage: number) => void;
  onRotatePage: (originalPage: number, delta: -90 | 90 | 180) => void;
  onUndo: () => void;
  onRedo: () => void;
  operations: PageOperationEntity[];
  onDeleteOperation: (operationId: string) => void;
}

export function PageOrganizerPanel({
  totalPages,
  orderedPages,
  activePage,
  rotationByOriginalPage,
  canUndo,
  canRedo,
  onSelectPage,
  onMovePage,
  onRotatePage,
  onUndo,
  onRedo,
  operations,
  onDeleteOperation,
}: PageOrganizerPanelProps) {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <div className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Page organizer
          </h3>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Undo page operation"
              title="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={onRedo}
              disabled={!canRedo}
              aria-label="Redo page operation"
              title="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {totalPages} pages in current document
        </p>
      </div>

      <div className="grid min-h-0 grid-rows-[1fr_auto]">
        <div className="space-y-2 overflow-y-auto p-3">
          {orderedPages.map((originalPage, index) => {
            const displayPage = index + 1;
            const isSelected = activePage === originalPage;
            const canMoveUp = index > 0;
            const canMoveDown = index < orderedPages.length - 1;
            const previousOriginal = canMoveUp ? orderedPages[index - 1] : originalPage;
            const nextOriginal = canMoveDown ? orderedPages[index + 1] : originalPage;
            const rotation = rotationByOriginalPage[originalPage] ?? 0;

            return (
              <div
                key={`organizer-item-${originalPage}`}
                className={`rounded-md border p-2 ${
                  isSelected
                    ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
                    : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
                }`}
              >
                <button
                  type="button"
                  className="mb-2 flex w-full items-center justify-between text-left"
                  onClick={() => onSelectPage(originalPage)}
                >
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                    Page {displayPage}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    src {originalPage} / rot {rotation}deg
                  </span>
                </button>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onMovePage(originalPage, previousOriginal)}
                    disabled={!canMoveUp}
                    aria-label={`Move page ${displayPage} up`}
                    title="Move up"
                  >
                    <GripVertical className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onMovePage(originalPage, nextOriginal)}
                    disabled={!canMoveDown}
                    aria-label={`Move page ${displayPage} down`}
                    title="Move down"
                  >
                    <GripVertical className="h-4 w-4 rotate-180" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onRotatePage(originalPage, 90)}
                    aria-label={`Rotate page ${displayPage}`}
                    title="Rotate clockwise"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            Operation log
          </h4>
          <div className="max-h-44 space-y-2 overflow-y-auto">
            {operations.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                No page operations yet.
              </p>
            ) : (
              operations
                .slice()
                .reverse()
                .map((operation) => (
                  <div
                    key={operation.id}
                    className="flex items-center justify-between gap-2 rounded border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700"
                  >
                    <span className="truncate text-zinc-700 dark:text-zinc-200">
                      {operation.type}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => onDeleteOperation(operation.id)}
                      aria-label="Delete operation"
                      title="Delete operation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
