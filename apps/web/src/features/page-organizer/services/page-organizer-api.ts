"use client";

import type {
  PageOperationEntity,
  PageOperationType,
  PageOperationPayload,
} from "@/features/page-organizer/domain/page-organizer";

interface PageOperationApiRecord {
  id: string;
  documentId: string;
  type: PageOperationType;
  payloadJson?: unknown;
  createdAt: string;
  updatedAt: string;
}

function parsePayload(payloadJson: unknown): PageOperationPayload {
  return payloadJson && typeof payloadJson === "object"
    ? (payloadJson as PageOperationPayload)
    : ({ fromPage: 1, toPage: 1 } as PageOperationPayload);
}

export function mapPageOperationRecordToEntity(
  record: PageOperationApiRecord,
  documentKey: string,
): PageOperationEntity {
  return {
    id: record.id,
    documentKey,
    persisted: true,
    persistedDocumentId: record.documentId,
    syncVersion: Number(
      (record.payloadJson as { syncVersion?: number } | undefined)?.syncVersion ?? 0,
    ),
    type: record.type,
    payload: parsePayload(record.payloadJson),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function fetchPageOperations(
  documentId: string,
  documentKey: string,
): Promise<PageOperationEntity[]> {
  const response = await fetch(
    `/api/page-operations?documentId=${encodeURIComponent(documentId)}`,
    { method: "GET" },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch page operations.");
  }
  const json = (await response.json()) as { data: PageOperationApiRecord[] };
  return json.data.map((item) => mapPageOperationRecordToEntity(item, documentKey));
}

export async function createPageOperationOnServer(
  documentId: string,
  operation: PageOperationEntity,
): Promise<PageOperationEntity> {
  const payloadJson = operation.payload as unknown as Record<string, unknown>;
  const response = await fetch("/api/page-operations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentId,
      type: operation.type,
      payloadJson,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to persist page operation.");
  }
  const json = (await response.json()) as { data: PageOperationApiRecord };
  return mapPageOperationRecordToEntity(json.data, operation.documentKey);
}

export async function deletePageOperationOnServer(operationId: string): Promise<void> {
  const response = await fetch(`/api/page-operations/${encodeURIComponent(operationId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete page operation.");
  }
}

