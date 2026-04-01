export type DocumentVersionSource =
  | "UPLOAD"
  | "EDIT"
  | "IMPORT"
  | "OCR"
  | "SIGNATURE"
  | "API";

export type ActivityType =
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

export interface CollaborationCommentEntity {
  id: string;
  documentId: string;
  documentKey?: string;
  persistedDocumentId?: string;
  persisted?: boolean;
  authorUserId?: string;
  body: string;
  pageNumber?: number;
  anchorJson?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersionEntity {
  id: string;
  documentId: string;
  documentKey?: string;
  persistedDocumentId?: string;
  persisted?: boolean;
  versionNumber: number;
  source: DocumentVersionSource;
  storageKey: string;
  checksumSha256: string;
  pageCount: number;
  metadataJson?: unknown;
  createdByUserId?: string;
  label?: string;
  createdAt: string;
  isCurrent?: boolean;
}

export interface ActivityEventEntity {
  id: string;
  documentId?: string;
  documentKey?: string;
  actorUserId?: string;
  type: ActivityType;
  payloadJson?: unknown;
  createdAt: string;
}

export type CommentEntity = CollaborationCommentEntity;
export type CollaborationVersionEntity = DocumentVersionEntity;
export type CollaborationActivityEntity = ActivityEventEntity;
export type CollaborationActivityEventEntity = ActivityEventEntity;
