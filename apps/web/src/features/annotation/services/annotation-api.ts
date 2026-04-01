"use client";

import type { AnnotationEntity, AnnotationRect } from "@/features/annotation/domain/annotation";

interface AnnotationApiRecord {
  id: string;
  documentId: string;
  pageNumber: number;
  kind: "HIGHLIGHT" | "NOTE";
  payloadJson?: unknown;
  createdAt: string;
  updatedAt: string;
}

interface SyncTask {
  key: string;
  run: () => Promise<void>;
}

const pendingTaskByKey = new Map<string, SyncTask>();
const timeoutByKey = new Map<string, number>();

function scheduleDebouncedTask(
  key: string,
  delayMs: number,
  run: () => Promise<void>,
): void {
  pendingTaskByKey.set(key, { key, run });

  const existingTimeout = timeoutByKey.get(key);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  const timeoutId = window.setTimeout(() => {
    const task = pendingTaskByKey.get(key);
    pendingTaskByKey.delete(key);
    timeoutByKey.delete(key);
    if (!task) {
      return;
    }
    void task.run();
  }, delayMs);

  timeoutByKey.set(key, timeoutId);
}

function parseRect(payloadJson: unknown): AnnotationRect {
  const payload =
    payloadJson && typeof payloadJson === "object"
      ? (payloadJson as Record<string, unknown>)
      : {};
  const rect =
    payload.rect && typeof payload.rect === "object"
      ? (payload.rect as Record<string, unknown>)
      : {};

  return {
    xPct: Number(rect.xPct ?? 0),
    yPct: Number(rect.yPct ?? 0),
    widthPct: Number(rect.widthPct ?? 0),
    heightPct: Number(rect.heightPct ?? 0),
  };
}

function parseSyncVersion(payloadJson: unknown): number {
  const payload =
    payloadJson && typeof payloadJson === "object"
      ? (payloadJson as Record<string, unknown>)
      : {};
  const value = payload.syncVersion;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return 0;
}

function getColor(kind: "HIGHLIGHT" | "NOTE"): string {
  return kind === "HIGHLIGHT" ? "#fde047" : "#38bdf8";
}

export function mapAnnotationRecordToEntity(
  record: AnnotationApiRecord,
  documentKey: string,
): AnnotationEntity {
  const payload =
    record.payloadJson && typeof record.payloadJson === "object"
      ? (record.payloadJson as Record<string, unknown>)
      : {};

  return {
    id: record.id,
    documentKey,
    persistedDocumentId: record.documentId,
    persisted: true,
    syncVersion: parseSyncVersion(record.payloadJson),
    pageNumber: record.pageNumber,
    kind: record.kind,
    rect: parseRect(record.payloadJson),
    color: getColor(record.kind),
    noteText: typeof payload.noteText === "string" ? payload.noteText : undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function fetchAnnotations(
  documentId: string,
  documentKey: string,
): Promise<AnnotationEntity[]> {
  const response = await fetch(
    `/api/annotations?documentId=${encodeURIComponent(documentId)}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch annotations.");
  }

  const json = (await response.json()) as { data: AnnotationApiRecord[] };
  return json.data.map((item) => mapAnnotationRecordToEntity(item, documentKey));
}

export async function createAnnotationOnServer(
  documentId: string,
  annotation: AnnotationEntity,
): Promise<AnnotationEntity> {
  const response = await fetch("/api/annotations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentId,
      pageNumber: annotation.pageNumber,
      kind: annotation.kind,
      rect: annotation.rect,
      noteText: annotation.noteText,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to persist annotation.");
  }

  const json = (await response.json()) as { data: AnnotationApiRecord };
  return mapAnnotationRecordToEntity(json.data, annotation.documentKey);
}

export async function updateAnnotationRectOnServer(
  annotationId: string,
  rect: AnnotationRect,
  syncVersion: number,
): Promise<void> {
  const response = await fetch(`/api/annotations/${encodeURIComponent(annotationId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rect, syncVersion }),
  });

  if (!response.ok) {
    throw new Error("Failed to update annotation rect.");
  }
}

export function enqueueAnnotationRectSync(
  annotationId: string,
  rect: AnnotationRect,
  syncVersion: number,
): void {
  scheduleDebouncedTask(
    `rect:${annotationId}`,
    220,
    async () => updateAnnotationRectOnServer(annotationId, rect, syncVersion),
  );
}

export async function updateAnnotationNoteTextOnServer(
  annotationId: string,
  noteText: string,
  syncVersion: number,
): Promise<void> {
  const response = await fetch(`/api/annotations/${encodeURIComponent(annotationId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ noteText, syncVersion }),
  });

  if (!response.ok) {
    throw new Error("Failed to update annotation note text.");
  }
}

export function enqueueAnnotationNoteTextSync(
  annotationId: string,
  noteText: string,
  syncVersion: number,
): void {
  scheduleDebouncedTask(
    `note:${annotationId}`,
    280,
    async () => updateAnnotationNoteTextOnServer(annotationId, noteText, syncVersion),
  );
}

export async function deleteAnnotationOnServer(annotationId: string): Promise<void> {
  const response = await fetch(`/api/annotations/${encodeURIComponent(annotationId)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete annotation.");
  }
}
