import { NextResponse } from "next/server";

import {
  createPageOperationRequestSchema,
} from "@/features/page-organizer/services/page-organizer-api.types";
import type { PageOperationType } from "@/features/page-organizer/domain/page-organizer";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return NextResponse.json(
      { error: "documentId query parameter is required." },
      { status: 400 },
    );
  }

  const operations = await prisma.pageOrganizerOperation.findMany({
    where: {
      documentId,
      deletedAt: null,
    },
    orderBy: [{ createdAt: "asc" }],
  });

  return NextResponse.json({
    data: operations.map((item: (typeof operations)[number]) => ({
      id: item.id,
      documentId: item.documentId,
      type: item.operation as PageOperationType,
      payloadJson: item.payloadJson,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
  });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createPageOperationRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid page operation payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const document = await prisma.document.findUnique({
    where: { id: parsed.data.documentId },
    select: { id: true, organizationId: true },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const now = new Date();
  const created = await prisma.pageOrganizerOperation.create({
    data: {
      organizationId: document.organizationId,
      documentId: parsed.data.documentId,
      operation: parsed.data.type,
      payloadJson: {
        ...parsed.data.payloadJson,
        syncVersion: 1,
      },
      createdAt: now,
      updatedAt: now,
    },
  });

  return NextResponse.json({
    data: {
      id: created.id,
      documentId: created.documentId,
      type: created.operation,
      payloadJson: created.payloadJson,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    },
  }, { status: 201 });
}
