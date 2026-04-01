"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAnnotationStore } from "@/stores/annotation.store";
import type { Annotation } from "@/types/annotation";

const AUTOSAVE_DEBOUNCE_MS = 2000;

/**
 * useAnnotations — loads annotations from the server and auto-saves changes.
 *
 * Design:
 * - On mount: fetch GET /api/documents/:id/annotations → populate store
 * - On store changes (isDirty): debounced PUT to bulk-upsert
 * - Individual annotation operations (resolve, delete) send immediate PATCH/DELETE
 */
export function useAnnotations(documentId: string) {
  const { annotations, isDirty, actions } = useAnnotationStore();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  // ── Load annotations on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!documentId) return;

    fetch(`/api/documents/${documentId}/annotations`)
      .then((r) => r.json())
      .then((body) => {
        if (body.data) {
          // Normalize dates
          const normalized: Annotation[] = body.data.map(
            (a: Annotation & { createdAt: string; updatedAt: string }) => ({
              ...a,
              createdAt: new Date(a.createdAt),
              updatedAt: new Date(a.updatedAt),
            })
          );
          actions.setAnnotations(normalized);
          actions.setIsDirty(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load annotations:", err);
      });
  }, [documentId, actions]);

  // ── Auto-save with debounce ───────────────────────────────────────────────
  const save = useCallback(
    async (annotationsToSave: Annotation[]) => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;

      try {
        const res = await fetch(`/api/documents/${documentId}/annotations`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            annotations: annotationsToSave
              .filter((a) => !a.deletedAt)
              .map((a) => ({
                id: a.id,
                page: a.page,
                type: a.type,
                data: a.data,
              })),
          }),
        });

        if (res.ok) {
          actions.setIsDirty(false);
        }
      } catch (err) {
        console.error("Auto-save failed:", err);
      } finally {
        isSavingRef.current = false;
      }
    },
    [documentId, actions]
  );

  useEffect(() => {
    if (!isDirty) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      save(annotations);
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [isDirty, annotations, save]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (isDirty) {
        save(annotations);
      }
    };
    // intentionally only on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    saveNow: () => save(annotations),
    isSaving: isSavingRef.current,
  };
}
