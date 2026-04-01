"use client";

import type {
  OcrJobEntity,
  OcrResultEntity,
  OcrJobStatus,
} from "@/features/ocr/domain/ocr-job";

interface OcrResultApiRecord {
  id: string;
  ocrJobId: string;
  pageNumber: number;
  confidence: number;
  text: string;
  blocksJson?: unknown;
  createdAt: string;
}

interface OcrJobApiRecord {
  id: string;
  documentId: string;
  documentVersionId: string;
  status: OcrJobStatus;
  provider: string;
  errorMessage?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  results?: OcrResultApiRecord[];
}

function mapResult(record: OcrResultApiRecord): OcrResultEntity {
  return {
    id: record.id,
    ocrJobId: record.ocrJobId,
    pageNumber: record.pageNumber,
    confidence: record.confidence,
    text: record.text,
    blocksJson: record.blocksJson,
    createdAt: record.createdAt,
  };
}

function mapJob(record: OcrJobApiRecord, documentKey: string): OcrJobEntity {
  return {
    id: record.id,
    documentId: record.documentId,
    documentVersionId: record.documentVersionId,
    documentKey,
    persisted: true,
    status: record.status,
    provider: record.provider,
    errorMessage: record.errorMessage ?? undefined,
    createdAt: record.createdAt,
    startedAt: record.startedAt ?? undefined,
    completedAt: record.completedAt ?? undefined,
    results: (record.results ?? []).map(mapResult),
  };
}

export async function fetchOcrJobs(
  documentId: string,
  documentKey: string,
): Promise<OcrJobEntity[]> {
  const response = await fetch(
    `/api/ocr-jobs?documentId=${encodeURIComponent(documentId)}`,
    { method: "GET" },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch OCR jobs.");
  }
  const json = (await response.json()) as { data: OcrJobApiRecord[] };
  return json.data.map((job) => mapJob(job, documentKey));
}

export async function createOcrJobOnServer(input: {
  documentId: string;
  documentKey: string;
  provider?: string;
  pageCountHint?: number;
}): Promise<OcrJobEntity> {
  const response = await fetch("/api/ocr-jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentId: input.documentId,
      provider: input.provider,
      pageCountHint: input.pageCountHint,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to start OCR job.");
  }
  const json = (await response.json()) as { data: OcrJobApiRecord };
  return mapJob(json.data, input.documentKey);
}

export async function fetchOcrJobOnServer(
  jobId: string,
  documentKey: string,
): Promise<OcrJobEntity> {
  const response = await fetch(`/api/ocr-jobs/${encodeURIComponent(jobId)}`, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch OCR job.");
  }
  const json = (await response.json()) as { data: OcrJobApiRecord };
  return mapJob(json.data, documentKey);
}
