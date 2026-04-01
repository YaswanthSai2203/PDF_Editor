"use client";

import { create } from "zustand";

import type {
  AnnotationEntity,
  AnnotationKind,
  AnnotationRect,
  AnnotationTool,
  CreateAnnotationInput,
} from "@/features/annotation/domain/annotation";

interface AnnotationState {
  activeTool: AnnotationTool;
  selectedAnnotationId: string | null;
  annotationsByDocument: Record<string, AnnotationEntity[]>;
  historyByDocument: Record<string, AnnotationEntity[][]>;
  futureByDocument: Record<string, AnnotationEntity[][]>;
  setDocumentAnnotations: (
    documentKey: string,
    annotations: AnnotationEntity[],
  ) => void;
  setActiveTool: (tool: AnnotationTool) => void;
  selectAnnotation: (annotationId: string | null) => void;
  createAnnotation: (input: CreateAnnotationInput) => AnnotationEntity;
  replaceAnnotation: (
    documentKey: string,
    previousId: string,
    next: AnnotationEntity,
  ) => void;
  deleteAnnotation: (documentKey: string, annotationId: string) => void;
  updateAnnotationRect: (
    documentKey: string,
    annotationId: string,
    rect: AnnotationRect,
  ) => void;
  updateAnnotationNoteText: (
    documentKey: string,
    annotationId: string,
    noteText: string,
  ) => void;
  undo: (documentKey: string) => void;
  redo: (documentKey: string) => void;
  canUndo: (documentKey: string) => boolean;
  canRedo: (documentKey: string) => boolean;
  getAnnotationById: (
    documentKey: string,
    annotationId: string,
  ) => AnnotationEntity | undefined;
  getAnnotationsForPage: (
    documentKey: string,
    pageNumber: number,
  ) => AnnotationEntity[];
}

function getDefaultColor(kind: AnnotationKind): string {
  if (kind === "HIGHLIGHT") {
    return "#fde047";
  }
  return "#38bdf8";
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  activeTool: "SELECT",
  selectedAnnotationId: null,
  annotationsByDocument: {},
  historyByDocument: {},
  futureByDocument: {},

  setDocumentAnnotations: (documentKey, annotations) => {
    set((state) => ({
      annotationsByDocument: {
        ...state.annotationsByDocument,
        [documentKey]: annotations,
      },
      historyByDocument: {
        ...state.historyByDocument,
        [documentKey]: [],
      },
      futureByDocument: {
        ...state.futureByDocument,
        [documentKey]: [],
      },
      selectedAnnotationId: state.selectedAnnotationId,
    }));
  },

  setActiveTool: (tool) => {
    set({ activeTool: tool });
  },

  selectAnnotation: (annotationId) => {
    set({ selectedAnnotationId: annotationId });
  },

  createAnnotation: (input) => {
    const annotationId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `ann_${crypto.randomUUID()}`
        : `ann_${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();
    const created: AnnotationEntity = {
      id: annotationId,
      documentKey: input.documentKey,
      persisted: false,
      syncVersion: 0,
      pageNumber: input.pageNumber,
      kind: input.kind,
      rect: input.rect,
      color: getDefaultColor(input.kind),
      noteText: input.kind === "NOTE" ? "New note" : undefined,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const existing = state.annotationsByDocument[input.documentKey] ?? [];
      const previousSnapshot = existing.map((item) => ({ ...item }));
      const nextCollection = [...existing, created];
      return {
        selectedAnnotationId: created.id,
        annotationsByDocument: {
          ...state.annotationsByDocument,
          [input.documentKey]: nextCollection,
        },
        historyByDocument: {
          ...state.historyByDocument,
          [input.documentKey]: [
            ...(state.historyByDocument[input.documentKey] ?? []),
            previousSnapshot,
          ],
        },
        futureByDocument: {
          ...state.futureByDocument,
          [input.documentKey]: [],
        },
      };
    });

    return created;
  },

  replaceAnnotation: (documentKey, previousId, nextAnnotation) => {
    set((state) => {
      const existing = state.annotationsByDocument[documentKey] ?? [];
      const next = existing.map((item) =>
        item.id === previousId ? nextAnnotation : item,
      );
      return {
        selectedAnnotationId:
          state.selectedAnnotationId === previousId
            ? nextAnnotation.id
            : state.selectedAnnotationId,
        annotationsByDocument: {
          ...state.annotationsByDocument,
          [documentKey]: next,
        },
      };
    });
  },

  deleteAnnotation: (documentKey, annotationId) => {
    set((state) => {
      const existing = state.annotationsByDocument[documentKey] ?? [];
      const previousSnapshot = existing.map((item) => ({ ...item }));
      const next = existing.filter((item) => item.id !== annotationId);
      return {
        selectedAnnotationId:
          state.selectedAnnotationId === annotationId
            ? null
            : state.selectedAnnotationId,
        annotationsByDocument: {
          ...state.annotationsByDocument,
          [documentKey]: next,
        },
        historyByDocument: {
          ...state.historyByDocument,
          [documentKey]: [
            ...(state.historyByDocument[documentKey] ?? []),
            previousSnapshot,
          ],
        },
        futureByDocument: {
          ...state.futureByDocument,
          [documentKey]: [],
        },
      };
    });
  },

  updateAnnotationRect: (documentKey, annotationId, rect) => {
    set((state) => {
      const existing = state.annotationsByDocument[documentKey] ?? [];
      const previousSnapshot = existing.map((item) => ({ ...item }));
      const next = existing.map((item) => {
        if (item.id !== annotationId) {
          return item;
        }
        return {
          ...item,
          rect,
          syncVersion: (item.syncVersion ?? 0) + 1,
          updatedAt: new Date().toISOString(),
        };
      });

      return {
        annotationsByDocument: {
          ...state.annotationsByDocument,
          [documentKey]: next,
        },
        historyByDocument: {
          ...state.historyByDocument,
          [documentKey]: [
            ...(state.historyByDocument[documentKey] ?? []),
            previousSnapshot,
          ],
        },
        futureByDocument: {
          ...state.futureByDocument,
          [documentKey]: [],
        },
      };
    });
  },

  updateAnnotationNoteText: (documentKey, annotationId, noteText) => {
    set((state) => {
      const existing = state.annotationsByDocument[documentKey] ?? [];
      const previousSnapshot = existing.map((item) => ({ ...item }));
      const next = existing.map((item) => {
        if (item.id !== annotationId) {
          return item;
        }
        return {
          ...item,
          noteText,
          syncVersion: (item.syncVersion ?? 0) + 1,
          updatedAt: new Date().toISOString(),
        };
      });

      return {
        annotationsByDocument: {
          ...state.annotationsByDocument,
          [documentKey]: next,
        },
        historyByDocument: {
          ...state.historyByDocument,
          [documentKey]: [
            ...(state.historyByDocument[documentKey] ?? []),
            previousSnapshot,
          ],
        },
        futureByDocument: {
          ...state.futureByDocument,
          [documentKey]: [],
        },
      };
    });
  },

  undo: (documentKey) => {
    set((state) => {
      const history = state.historyByDocument[documentKey] ?? [];
      if (history.length === 0) {
        return {};
      }

      const current = state.annotationsByDocument[documentKey] ?? [];
      const previous = history[history.length - 1];

      return {
        annotationsByDocument: {
          ...state.annotationsByDocument,
          [documentKey]: previous,
        },
        historyByDocument: {
          ...state.historyByDocument,
          [documentKey]: history.slice(0, -1),
        },
        futureByDocument: {
          ...state.futureByDocument,
          [documentKey]: [
            ...(state.futureByDocument[documentKey] ?? []),
            current,
          ],
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

      const current = state.annotationsByDocument[documentKey] ?? [];
      const next = future[future.length - 1];

      return {
        annotationsByDocument: {
          ...state.annotationsByDocument,
          [documentKey]: next,
        },
        futureByDocument: {
          ...state.futureByDocument,
          [documentKey]: future.slice(0, -1),
        },
        historyByDocument: {
          ...state.historyByDocument,
          [documentKey]: [
            ...(state.historyByDocument[documentKey] ?? []),
            current,
          ],
        },
      };
    });
  },

  canUndo: (documentKey) => {
    const history = get().historyByDocument[documentKey] ?? [];
    return history.length > 0;
  },

  canRedo: (documentKey) => {
    const future = get().futureByDocument[documentKey] ?? [];
    return future.length > 0;
  },

  getAnnotationById: (documentKey, annotationId) => {
    const collection = get().annotationsByDocument[documentKey] ?? [];
    return collection.find((item) => item.id === annotationId);
  },

  getAnnotationsForPage: (documentKey, pageNumber) => {
    const items = get().annotationsByDocument[documentKey] ?? [];
    return items.filter((item) => item.pageNumber === pageNumber);
  },
}));
