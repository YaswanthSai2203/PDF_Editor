export type DocumentStatus = "PROCESSING" | "READY" | "ERROR";
export type OcrStatus = "NONE" | "PENDING" | "PROCESSING" | "DONE" | "ERROR";

export interface Document {
  id: string;
  title: string;
  description?: string | null;
  ownerId: string;
  teamId?: string | null;
  storageKey: string;
  fileSize: number;
  pageCount: number;
  status: DocumentStatus;
  isShared: boolean;
  shareToken?: string | null;
  thumbnailKey?: string | null;
  ocrStatus: OcrStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  storageKey: string;
  fileSize: number;
  changeNote?: string | null;
  createdById?: string | null;
  createdAt: Date;
}

export interface DocumentListItem {
  id: string;
  title: string;
  fileSize: number;
  pageCount: number;
  status: DocumentStatus;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentUploadParams {
  file: File;
  title?: string;
  teamId?: string;
}

export interface DocumentUploadResult {
  documentId: string;
  uploadUrl: string;
  storageKey: string;
}
