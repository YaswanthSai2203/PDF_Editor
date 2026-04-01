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
  setActiveTool: (tool: AnnotationTool) => void;
  selectAnnotation: (annotationId: string | null) => void;
  createAnnotation: (input: CreateAnnotationInput) => AnnotationEntity;
  deleteAnnotation: (documentKey: string, annotationId: string) => void;
  updateAnnotationRect: (
    documentKey: string,
    annotationId: string,
    rect: AnnotationRect,
  ) => void;
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
      return {
        selectedAnnotationId: created.id,
        annotationsByDocument: {
          ...state.annotationsByDocument,
          [input.documentKey]: [...existing, created],
        },
      };
    });

    return created;
  },

  deleteAnnotation: (documentKey, annotationId) => {
    set((state) => {
      const existing = state.annotationsByDocument[documentKey] ?? [];
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
      };
    });
  },

  updateAnnotationRect: (documentKey, annotationId, rect) => {
    set((state) => {
      const existing = state.annotationsByDocument[documentKey] ?? [];
      const next = existing.map((item) => {
        if (item.id !== annotationId) {
          return item;
        }
        return {
          ...item,
          rect,
          updatedAt: new Date().toISOString(),
        };
      });

      return {
        annotationsByDocument: {
          ...state.annotationsByDocument,
          [documentKey]: next,
        },
      };
    });
  },

  getAnnotationsForPage: (documentKey, pageNumber) => {
    const items = get().annotationsByDocument[documentKey] ?? [];
    return items.filter((item) => item.pageNumber === pageNumber);
  },
}));
