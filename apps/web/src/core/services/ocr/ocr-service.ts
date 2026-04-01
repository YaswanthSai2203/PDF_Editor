export interface OcrRequestInput {
  organizationId: string;
  documentId: string;
  documentVersionId: string;
  actorUserId: string;
  languageHints?: string[];
}

export interface OcrRequestOutput {
  jobId: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
}

export interface OcrResultPage {
  pageNumber: number;
  confidence: number;
  text: string;
}

export interface OcrService {
  enqueueOcr(input: OcrRequestInput): Promise<OcrRequestOutput>;
  getResult(jobId: string): Promise<{ pages: OcrResultPage[] } | null>;
}
