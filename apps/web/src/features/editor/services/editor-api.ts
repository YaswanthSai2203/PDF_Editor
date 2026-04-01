"use client";

import type {
  EditorElementEntity,
  EditorElementRect,
  EditorTextStyle,
} from "@/features/editor/domain/editor-element";

interface EditorElementApiRecord {
  id: string;
  documentId: string;
  pageNumber: number;
  kind: "TEXT" | "IMAGE";
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

function parseRect(payloadJson: unknown): EditorElementRect {
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

function parseTextContent(payloadJson: unknown): string | undefined {
  const payload =
    payloadJson && typeof payloadJson === "object"
      ? (payloadJson as Record<string, unknown>)
      : {};
  return typeof payload.textContent === "string" ? payload.textContent : undefined;
}

function parseImageSrc(payloadJson: unknown): string | undefined {
  const payload =
    payloadJson && typeof payloadJson === "object"
      ? (payloadJson as Record<string, unknown>)
      : {};
  return typeof payload.imageSrc === "string" ? payload.imageSrc : undefined;
}

function parseTextStyle(payloadJson: unknown): EditorTextStyle {
  const payload =
    payloadJson && typeof payloadJson === "object"
      ? (payloadJson as Record<string, unknown>)
      : {};
  const textStyle =
    payload.textStyle && typeof payload.textStyle === "object"
      ? (payload.textStyle as Record<string, unknown>)
      : {};

  const size = Number(textStyle.fontSizePx);
  return {
    fontSizePx: Number.isFinite(size) ? size : 14,
    color:
      typeof textStyle.color === "string" && textStyle.color.trim().length > 0
        ? textStyle.color
        : "#111827",
  };
}

export function mapEditorElementRecordToEntity(
  record: EditorElementApiRecord,
  documentKey: string,
): EditorElementEntity {
  return {
    id: record.id,
    documentKey,
    persistedDocumentId: record.documentId,
    persisted: true,
    syncVersion: parseSyncVersion(record.payloadJson),
    pageNumber: record.pageNumber,
    kind: record.kind,
    rect: parseRect(record.payloadJson),
    textContent: parseTextContent(record.payloadJson),
    textStyle: parseTextStyle(record.payloadJson),
    imageSrc: parseImageSrc(record.payloadJson),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function fetchEditorElements(
  documentId: string,
  documentKey: string,
): Promise<EditorElementEntity[]> {
  const response = await fetch(
    `/api/editor-elements?documentId=${encodeURIComponent(documentId)}`,
    { method: "GET" },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch editor elements.");
  }

  const json = (await response.json()) as { data: EditorElementApiRecord[] };
  return json.data.map((item) => mapEditorElementRecordToEntity(item, documentKey));
}

export async function createEditorElementOnServer(
  documentId: string,
  element: EditorElementEntity,
): Promise<EditorElementEntity> {
  const response = await fetch("/api/editor-elements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentId,
      pageNumber: element.pageNumber,
      kind: element.kind,
      rect: element.rect,
      textContent: element.textContent,
      textStyle: element.textStyle,
      imageSrc: element.imageSrc,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to persist editor element.");
  }

  const json = (await response.json()) as { data: EditorElementApiRecord };
  return mapEditorElementRecordToEntity(json.data, element.documentKey);
}

export async function updateEditorElementOnServer(
  elementId: string,
  input: {
    rect?: EditorElementRect;
    textContent?: string;
    textStyle?: EditorTextStyle;
    imageSrc?: string;
    syncVersion?: number;
  },
): Promise<void> {
  const response = await fetch(`/api/editor-elements/${encodeURIComponent(elementId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to update editor element.");
  }
}

export function enqueueEditorRectSync(
  elementId: string,
  rect: EditorElementRect,
  syncVersion: number,
): void {
  scheduleDebouncedTask(
    `editor-rect:${elementId}`,
    220,
    async () => updateEditorElementOnServer(elementId, { rect, syncVersion }),
  );
}

export function enqueueEditorTextSync(
  elementId: string,
  textContent: string,
  textStyle: EditorTextStyle,
  syncVersion: number,
): void {
  scheduleDebouncedTask(
    `editor-text:${elementId}`,
    260,
    async () =>
      updateEditorElementOnServer(elementId, {
        textContent,
        textStyle,
        syncVersion,
      }),
  );
}

export function enqueueEditorImageSync(
  elementId: string,
  imageSrc: string,
  syncVersion: number,
): void {
  scheduleDebouncedTask(
    `editor-image:${elementId}`,
    260,
    async () =>
      updateEditorElementOnServer(elementId, {
        imageSrc,
        syncVersion,
      }),
  );
}

export async function deleteEditorElementOnServer(elementId: string): Promise<void> {
  const response = await fetch(`/api/editor-elements/${encodeURIComponent(elementId)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete editor element.");
  }
}
