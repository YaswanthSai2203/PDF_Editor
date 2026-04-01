import { NextResponse } from "next/server";

import { createAnnotationRequestSchema } from "@/features/annotation/services/annotation-api.types";
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

  const annotations = await prisma.annotation.findMany({
    where: {
      documentId,
      deletedAt: null,
    },
    orderBy: [{ pageNumber: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    data: annotations.map((item: (typeof annotations)[number]) => {
      const payload =
        item.payloadJson && typeof item.payloadJson === "object"
          ? (item.payloadJson as Record<string, unknown>)
          : {};
      return ({
      id: item.id,
      documentId: item.documentId,
      pageNumber: item.pageNumber,
      kind: item.kind,
      payloadJson: item.payloadJson,
      syncVersion:
        typeof payload.syncVersion === "number" ? payload.syncVersion : 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
    }),
  });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createAnnotationRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid annotation payload.", details: parsed.error.flatten() },
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
  const created = await prisma.annotation.create({
    data: {
      organizationId: document.organizationId,
      documentId: parsed.data.documentId,
      pageNumber: parsed.data.pageNumber,
      kind: parsed.data.kind,
      payloadJson: {
        rect: parsed.data.rect,
        noteText: parsed.data.noteText,
        syncVersion: 1,
      },
      createdAt: now,
      updatedAt: now,
    },
  });

  return NextResponse.json(
    {
      data: {
        id: created.id,
        documentId: created.documentId,
        pageNumber: created.pageNumber,
        kind: created.kind,
        payloadJson: created.payloadJson,
        syncVersion: 1,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
    },
    { status: 201 },
  );
}
