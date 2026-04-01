"use client";

import type {
  ActivityEventEntity,
  CollaborationCommentEntity,
  DocumentVersionEntity,
} from "@/features/collaboration/domain/collaboration";

interface CommentApiRecord {
  id: string;
  documentId: string;
  body: string;
  pageNumber: number | null;
  anchorJson: unknown;
  createdAt: string;
  updatedAt: string;
}

interface DocumentVersionApiRecord {
  id: string;
  documentId: string;
  versionNumber: number;
  source: "UPLOAD" | "EDIT" | "IMPORT" | "OCR" | "SIGNATURE" | "API";
  storageKey: string;
  checksumSha256: string;
  pageCount: number;
  metadataJson: unknown;
  createdAt: string;
  isCurrent: boolean;
}

interface ActivityEventApiRecord {
  id: string;
  documentId: string | null;
  actorUserId: string | null;
  type:
    | "DOCUMENT_UPLOADED"
    | "DOCUMENT_VERSION_CREATED"
    | "ANNOTATION_CREATED"
    | "ANNOTATION_UPDATED"
    | "PAGE_ORGANIZER_OPERATION_CREATED"
    | "SIGNATURE_REQUESTED"
    | "SIGNATURE_COMPLETED"
    | "OCR_REQUESTED"
    | "OCR_COMPLETED"
    | "COMMENT_ADDED";
  payloadJson: unknown;
  createdAt: string;
}

function mapComment(
  record: CommentApiRecord,
  documentKey: string,
): CollaborationCommentEntity {
  return {
    id: record.id,
    documentId: record.documentId,
    documentKey,
    persistedDocumentId: record.documentId,
    persisted: true,
    body: record.body,
    pageNumber: record.pageNumber ?? undefined,
    anchorJson: record.anchorJson ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapVersion(
  record: DocumentVersionApiRecord,
  documentKey: string,
): DocumentVersionEntity {
  return {
    id: record.id,
    documentId: record.documentId,
    documentKey,
    persistedDocumentId: record.documentId,
    persisted: true,
    versionNumber: record.versionNumber,
    source: record.source,
    storageKey: record.storageKey,
    checksumSha256: record.checksumSha256,
    pageCount: record.pageCount,
    metadataJson: record.metadataJson ?? undefined,
    createdAt: record.createdAt,
    isCurrent: record.isCurrent,
  };
}

function mapActivity(
  record: ActivityEventApiRecord,
  documentKey: string,
): ActivityEventEntity {
  return {
    id: record.id,
    documentId: record.documentId ?? undefined,
    documentKey,
    actorUserId: record.actorUserId ?? undefined,
    type: record.type,
    payloadJson: record.payloadJson ?? undefined,
    createdAt: record.createdAt,
  };
}

export async function fetchComments(
  documentId: string,
  documentKey: string,
): Promise<CollaborationCommentEntity[]> {
  const response = await fetch(
    `/api/comments?documentId=${encodeURIComponent(documentId)}`,
    {
      method: "GET",
    },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch comments.");
  }
  const json = (await response.json()) as { data: CommentApiRecord[] };
  return json.data.map((item) => mapComment(item, documentKey));
}

export async function createCommentOnServer(input: {
  documentId: string;
  documentKey: string;
  body: string;
  pageNumber?: number;
  anchorJson?: unknown;
}): Promise<CollaborationCommentEntity> {
  const response = await fetch("/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentId: input.documentId,
      body: input.body,
      pageNumber: input.pageNumber,
      anchorJson: input.anchorJson,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to create comment.");
  }
  const json = (await response.json()) as { data: CommentApiRecord };
  return mapComment(json.data, input.documentKey);
}

export async function deleteCommentOnServer(commentId: string): Promise<void> {
  const response = await fetch(`/api/comments/${encodeURIComponent(commentId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete comment.");
  }
}

export async function fetchDocumentVersions(
  documentId: string,
  documentKey: string,
): Promise<DocumentVersionEntity[]> {
  const response = await fetch(
    `/api/document-versions?documentId=${encodeURIComponent(documentId)}`,
    { method: "GET" },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch document versions.");
  }
  const json = (await response.json()) as { data: DocumentVersionApiRecord[] };
  return json.data.map((item) => mapVersion(item, documentKey));
}

export async function createDocumentVersionOnServer(input: {
  documentId: string;
  documentKey: string;
  source: "UPLOAD" | "EDIT" | "IMPORT" | "OCR" | "SIGNATURE" | "API";
  storageKey: string;
  checksumSha256: string;
  pageCount: number;
}): Promise<DocumentVersionEntity> {
  const response = await fetch("/api/document-versions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentId: input.documentId,
      source: input.source,
      storageKey: input.storageKey,
      checksumSha256: input.checksumSha256,
      pageCount: input.pageCount,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to create document version.");
  }
  const json = (await response.json()) as { data: DocumentVersionApiRecord };
  return mapVersion(json.data, input.documentKey);
}

export async function fetchActivityEvents(
  documentId: string,
  documentKey: string,
): Promise<ActivityEventEntity[]> {
  const response = await fetch(
    `/api/activity-events?documentId=${encodeURIComponent(documentId)}`,
    { method: "GET" },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch activity events.");
  }
  const json = (await response.json()) as { data: ActivityEventApiRecord[] };
  return json.data.map((item) => mapActivity(item, documentKey));
}
