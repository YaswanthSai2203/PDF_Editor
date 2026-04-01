"use client";

import { create } from "zustand";

import type {
  CreateEditorElementInput,
  EditorElementEntity,
  EditorElementRect,
  EditorTool,
} from "@/features/editor/domain/editor-element";

interface EditorState {
  activeTool: EditorTool;
  selectedElementId: string | null;
  elementsByDocument: Record<string, EditorElementEntity[]>;
  historyByDocument: Record<string, EditorElementEntity[][]>;
  futureByDocument: Record<string, EditorElementEntity[][]>;
  setActiveTool: (tool: EditorTool) => void;
  selectElement: (elementId: string | null) => void;
  setDocumentElements: (documentKey: string, elements: EditorElementEntity[]) => void;
  createElement: (input: CreateEditorElementInput) => EditorElementEntity;
  replaceElement: (
    documentKey: string,
    previousId: string,
    next: EditorElementEntity,
  ) => void;
  deleteElement: (documentKey: string, elementId: string) => void;
  updateElementRect: (
    documentKey: string,
    elementId: string,
    rect: EditorElementRect,
  ) => void;
  updateElementTextContent: (
    documentKey: string,
    elementId: string,
    text: string,
  ) => void;
  updateElementImageSource: (
    documentKey: string,
    elementId: string,
    imageSrc: string,
  ) => void;
  undo: (documentKey: string) => void;
  redo: (documentKey: string) => void;
  canUndo: (documentKey: string) => boolean;
  canRedo: (documentKey: string) => boolean;
  getElementById: (
    documentKey: string,
    elementId: string,
  ) => EditorElementEntity | undefined;
}

function nextId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `ed_${crypto.randomUUID()}`;
  }
  return `ed_${Math.random().toString(36).slice(2)}`;
}

function snapshot(items: EditorElementEntity[]): EditorElementEntity[] {
  return items.map((item) => ({
    ...item,
    rect: { ...item.rect },
  }));
}

function withHistoryUpdate(
  state: EditorState,
  documentKey: string,
  nextElements: EditorElementEntity[],
): Pick<EditorState, "elementsByDocument" | "historyByDocument" | "futureByDocument"> {
  const previous = state.elementsByDocument[documentKey] ?? [];
  return {
    elementsByDocument: {
      ...state.elementsByDocument,
      [documentKey]: nextElements,
    },
    historyByDocument: {
      ...state.historyByDocument,
      [documentKey]: [
        ...(state.historyByDocument[documentKey] ?? []),
        snapshot(previous),
      ],
    },
    futureByDocument: {
      ...state.futureByDocument,
      [documentKey]: [],
    },
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  activeTool: "SELECT",
  selectedElementId: null,
  elementsByDocument: {},
  historyByDocument: {},
  futureByDocument: {},

  setActiveTool: (tool) => set({ activeTool: tool }),
  selectElement: (elementId) => set({ selectedElementId: elementId }),

  setDocumentElements: (documentKey, elements) => {
    set((state) => ({
      elementsByDocument: {
        ...state.elementsByDocument,
        [documentKey]: elements,
      },
      historyByDocument: {
        ...state.historyByDocument,
        [documentKey]: [],
      },
      futureByDocument: {
        ...state.futureByDocument,
        [documentKey]: [],
      },
    }));
  },

  createElement: (input) => {
    const now = new Date().toISOString();
    const created: EditorElementEntity = {
      id: nextId(),
      documentKey: input.documentKey,
      pageNumber: input.pageNumber,
      kind: input.kind,
      rect: input.rect,
      textContent:
        input.kind === "TEXT"
          ? input.textContent && input.textContent.trim().length > 0
            ? input.textContent
            : "Edit text"
          : undefined,
      textStyle:
        input.kind === "TEXT"
          ? {
              color: input.textStyle?.color ?? "#111827",
              fontSizePx: input.textStyle?.fontSizePx ?? 16,
            }
          : undefined,
      imageSrc:
        input.kind === "IMAGE"
          ? input.imageSrc ??
            "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80"
          : undefined,
      opacity: input.opacity ?? 1,
      persisted: false,
      syncVersion: 0,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const existing = state.elementsByDocument[input.documentKey] ?? [];
      return {
        selectedElementId: created.id,
        ...withHistoryUpdate(state, input.documentKey, [...existing, created]),
      };
    });

    return created;
  },

  replaceElement: (documentKey, previousId, next) => {
    set((state) => {
      const existing = state.elementsByDocument[documentKey] ?? [];
      return {
        selectedElementId:
          state.selectedElementId === previousId ? next.id : state.selectedElementId,
        elementsByDocument: {
          ...state.elementsByDocument,
          [documentKey]: existing.map((item) => (item.id === previousId ? next : item)),
        },
      };
    });
  },

  deleteElement: (documentKey, elementId) => {
    set((state) => {
      const existing = state.elementsByDocument[documentKey] ?? [];
      return {
        selectedElementId:
          state.selectedElementId === elementId ? null : state.selectedElementId,
        ...withHistoryUpdate(
          state,
          documentKey,
          existing.filter((item) => item.id !== elementId),
        ),
      };
    });
  },

  updateElementRect: (documentKey, elementId, rect) => {
    set((state) => {
      const existing = state.elementsByDocument[documentKey] ?? [];
      const next = existing.map((item) =>
        item.id === elementId
          ? {
              ...item,
              rect,
              syncVersion: (item.syncVersion ?? 0) + 1,
              updatedAt: new Date().toISOString(),
            }
          : item,
      );
      return withHistoryUpdate(state, documentKey, next);
    });
  },

  updateElementTextContent: (documentKey, elementId, text) => {
    set((state) => {
      const existing = state.elementsByDocument[documentKey] ?? [];
      const next = existing.map((item) =>
        item.id === elementId
          ? {
              ...item,
              textContent: text,
              syncVersion: (item.syncVersion ?? 0) + 1,
              updatedAt: new Date().toISOString(),
            }
          : item,
      );
      return withHistoryUpdate(state, documentKey, next);
    });
  },

  updateElementImageSource: (documentKey, elementId, imageSrc) => {
    set((state) => {
      const existing = state.elementsByDocument[documentKey] ?? [];
      const next = existing.map((item) =>
        item.id === elementId
          ? {
              ...item,
              imageSrc,
              syncVersion: (item.syncVersion ?? 0) + 1,
              updatedAt: new Date().toISOString(),
            }
          : item,
      );
      return withHistoryUpdate(state, documentKey, next);
    });
  },

  undo: (documentKey) => {
    set((state) => {
      const history = state.historyByDocument[documentKey] ?? [];
      if (history.length === 0) {
        return {};
      }
      const current = state.elementsByDocument[documentKey] ?? [];
      const previous = history[history.length - 1];
      return {
        elementsByDocument: {
          ...state.elementsByDocument,
          [documentKey]: snapshot(previous),
        },
        historyByDocument: {
          ...state.historyByDocument,
          [documentKey]: history.slice(0, -1),
        },
        futureByDocument: {
          ...state.futureByDocument,
          [documentKey]: [...(state.futureByDocument[documentKey] ?? []), snapshot(current)],
        },
      };
    });
  },

  redo: (documentKey) => {
    set((state) => {
      const future = state.futureByDocument[documentKey] ?? [];
      if (future.length === 0) {
        return {};
      }
      const current = state.elementsByDocument[documentKey] ?? [];
      const next = future[future.length - 1];
      return {
        elementsByDocument: {
          ...state.elementsByDocument,
          [documentKey]: snapshot(next),
        },
        futureByDocument: {
          ...state.futureByDocument,
          [documentKey]: future.slice(0, -1),
        },
        historyByDocument: {
          ...state.historyByDocument,
          [documentKey]: [...(state.historyByDocument[documentKey] ?? []), snapshot(current)],
        },
      };
    });
  },

  canUndo: (documentKey) => (get().historyByDocument[documentKey] ?? []).length > 0,
  canRedo: (documentKey) => (get().futureByDocument[documentKey] ?? []).length > 0,
  getElementById: (documentKey, elementId) =>
    (get().elementsByDocument[documentKey] ?? []).find((item) => item.id === elementId),
}));
