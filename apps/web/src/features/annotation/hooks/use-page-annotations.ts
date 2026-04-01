"use client";

import { useMemo } from "react";

import { useAnnotationStore } from "@/features/annotation/services/annotation-store";

interface UsePageAnnotationsArgs {
  documentKey: string;
  pageNumber: number;
}

export function usePageAnnotations({
  documentKey,
  pageNumber,
}: UsePageAnnotationsArgs) {
  const annotationsByDocument = useAnnotationStore(
    (state) => state.annotationsByDocument,
  );
  const selectedAnnotationId = useAnnotationStore(
    (state) => state.selectedAnnotationId,
  );
  const activeTool = useAnnotationStore((state) => state.activeTool);
  const setActiveTool = useAnnotationStore((state) => state.setActiveTool);
  const selectAnnotation = useAnnotationStore((state) => state.selectAnnotation);
  const createAnnotation = useAnnotationStore((state) => state.createAnnotation);
  const deleteAnnotation = useAnnotationStore((state) => state.deleteAnnotation);
  const updateAnnotationRect = useAnnotationStore(
    (state) => state.updateAnnotationRect,
  );

  const annotations = useMemo(
    () =>
      (annotationsByDocument[documentKey] ?? []).filter(
        (item) => item.pageNumber === pageNumber,
      ),
    [annotationsByDocument, documentKey, pageNumber],
  );

  return {
    annotations,
    selectedAnnotationId,
    activeTool,
    setActiveTool,
    selectAnnotation,
    createAnnotation,
    deleteAnnotation,
    updateAnnotationRect,
  };
}
