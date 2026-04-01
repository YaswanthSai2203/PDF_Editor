import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  Annotation,
  AnnotationTool,
  AnnotationToolSettings,
} from "@/types/annotation";

interface AnnotationState {
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  activeTool: AnnotationTool;
  toolSettings: AnnotationToolSettings;
  isDrawing: boolean;
  isDirty: boolean; // unsaved changes

  actions: {
    setAnnotations: (annotations: Annotation[]) => void;
    addAnnotation: (annotation: Annotation) => void;
    updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
    removeAnnotation: (id: string) => void;
    selectAnnotation: (id: string | null) => void;
    setActiveTool: (tool: AnnotationTool) => void;
    updateToolSettings: (settings: Partial<AnnotationToolSettings>) => void;
    setIsDrawing: (drawing: boolean) => void;
    setIsDirty: (dirty: boolean) => void;
    resolveAnnotation: (id: string) => void;
    getAnnotationsForPage: (page: number) => Annotation[];
  };
}

export const useAnnotationStore = create<AnnotationState>()(
  devtools(
    (set, get) => ({
      annotations: [],
      selectedAnnotationId: null,
      activeTool: "SELECT",
      toolSettings: {
        color: "#FFEB3B",
        opacity: 0.5,
        strokeWidth: 2,
        fontSize: 14,
        fontFamily: "sans-serif",
      },
      isDrawing: false,
      isDirty: false,

      actions: {
        setAnnotations: (annotations) => set({ annotations }),

        addAnnotation: (annotation) =>
          set((s) => ({
            annotations: [...s.annotations, annotation],
            isDirty: true,
          })),

        updateAnnotation: (id, updates) =>
          set((s) => ({
            annotations: s.annotations.map((a) =>
              a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
            ),
            isDirty: true,
          })),

        removeAnnotation: (id) =>
          set((s) => ({
            annotations: s.annotations.filter((a) => a.id !== id),
            selectedAnnotationId:
              s.selectedAnnotationId === id ? null : s.selectedAnnotationId,
            isDirty: true,
          })),

        selectAnnotation: (id) => set({ selectedAnnotationId: id }),

        setActiveTool: (tool) =>
          set({ activeTool: tool, selectedAnnotationId: null }),

        updateToolSettings: (settings) =>
          set((s) => ({
            toolSettings: { ...s.toolSettings, ...settings },
          })),

        setIsDrawing: (drawing) => set({ isDrawing: drawing }),

        setIsDirty: (dirty) => set({ isDirty: dirty }),

        resolveAnnotation: (id) =>
          set((s) => ({
            annotations: s.annotations.map((a) =>
              a.id === id ? { ...a, isResolved: true } : a
            ),
            isDirty: true,
          })),

        getAnnotationsForPage: (page) =>
          get().annotations.filter((a) => a.page === page && !a.deletedAt),
      },
    }),
    { name: "annotation-store" }
  )
);
