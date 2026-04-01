export type OcrRequest = {
  documentVersionId: string;
  pageIds?: string[];
  languageHints?: string[];
};

export type OcrStatus = "queued" | "processing" | "succeeded" | "failed";

export type OcrJob = {
  id: string;
  status: OcrStatus;
  confidence?: number;
  completedAt?: Date;
};

export interface OcrService {
  enqueue(request: OcrRequest): Promise<OcrJob>;
  getJob(jobId: string): Promise<OcrJob | null>;
}
