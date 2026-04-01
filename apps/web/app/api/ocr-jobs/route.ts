import { NextResponse } from "next/server";
import { OcrJobStatus } from "@prisma/client";

import {
  createOcrJobRequestSchema,
  listOcrJobsQuerySchema,
} from "@/features/ocr/services/ocr-api.types";
import { prisma } from "@/lib/prisma";

function mapJobRecord(
  job: {
    id: string;
    documentId: string;
    documentVersionId: string;
    status: OcrJobStatus;
    provider: string;
    errorMessage: string | null;
    createdAt: Date;
    startedAt: Date | null;
    completedAt: Date | null;
    results?: Array<{
      id: string;
      ocrJobId: string;
      pageNumber: number;
      confidence: number;
      text: string;
      blocksJson: unknown;
      createdAt: Date;
    }>;
  },
) {
  return {
    id: job.id,
    documentId: job.documentId,
    documentVersionId: job.documentVersionId,
    status: job.status,
    provider: job.provider,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    results:
      job.results?.map((result) => ({
        id: result.id,
        ocrJobId: result.ocrJobId,
        pageNumber: result.pageNumber,
        confidence: result.confidence,
        text: result.text,
        blocksJson: result.blocksJson,
        createdAt: result.createdAt.toISOString(),
      })) ?? [],
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = listOcrJobsQuerySchema.safeParse({
    documentId: searchParams.get("documentId"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid OCR jobs query.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const jobs = await prisma.ocrJob.findMany({
    where: {
      documentId: parsed.data.documentId,
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      results: {
        orderBy: { pageNumber: "asc" },
      },
    },
  });

  return NextResponse.json({
    data: jobs.map((job) => mapJobRecord(job)),
  });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createOcrJobRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid OCR job payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const document = await prisma.document.findUnique({
    where: { id: parsed.data.documentId },
    select: {
      id: true,
      organizationId: true,
      currentVersionId: true,
    },
  });

  if (!document || !document.currentVersionId) {
    return NextResponse.json(
      { error: "Document or current version not found." },
      { status: 404 },
    );
  }

  const now = new Date();
  const created = await prisma.ocrJob.create({
    data: {
      organizationId: document.organizationId,
      documentId: document.id,
      documentVersionId: document.currentVersionId,
      provider: parsed.data.provider,
      status: "RUNNING",
      createdByUserId: null,
      createdAt: now,
      startedAt: now,
    },
  });

  // Simulated OCR processing step for this phase.
  const pageCount = Math.max(1, parsed.data.pageCountHint ?? 1);
  await prisma.ocrResult.createMany({
    data: Array.from({ length: pageCount }, (_, index) => ({
      ocrJobId: created.id,
      pageNumber: index + 1,
      confidence: 0.92,
      text: `OCR extracted text for page ${index + 1}.`,
      blocksJson: {
        provider: parsed.data.provider,
        simulated: true,
        pageNumber: index + 1,
      },
    })),
  });

  const completed = await prisma.ocrJob.update({
    where: { id: created.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
    include: {
      results: {
        orderBy: { pageNumber: "asc" },
      },
    },
  });

  return NextResponse.json(
    {
      data: mapJobRecord(completed),
    },
    { status: 201 },
  );
}
