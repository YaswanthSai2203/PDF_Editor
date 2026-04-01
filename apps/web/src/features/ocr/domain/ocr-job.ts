export type OcrJobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

export interface OcrResultEntity {
  id: string;
  ocrJobId: string;
  pageNumber: number;
  confidence: number;
  text: string;
  blocksJson?: unknown;
  createdAt: string;
}

export interface OcrJobEntity {
  id: string;
  documentId: string;
  documentKey?: string;
  persistedDocumentId?: string;
  persisted?: boolean;
  documentVersionId: string;
  status: OcrJobStatus;
  provider: string;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  results: OcrResultEntity[];
}

export interface CreateOcrJobInput {
  documentId: string;
  provider?: string;
}
