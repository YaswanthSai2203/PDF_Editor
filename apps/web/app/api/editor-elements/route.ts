import { NextResponse } from "next/server";

import { createEditorElementRequestSchema } from "@/features/editor/services/editor-api.types";
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

  const elements = await prisma.editorElement.findMany({
    where: {
      documentId,
      deletedAt: null,
    },
    orderBy: [{ pageNumber: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    data: elements.map((item: (typeof elements)[number]) => ({
      id: item.id,
      documentId: item.documentId,
      pageNumber: item.pageNumber,
      kind: item.kind,
      payloadJson: item.payloadJson,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
  });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createEditorElementRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid editor element payload.", details: parsed.error.flatten() },
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
  const created = await prisma.editorElement.create({
    data: {
      organizationId: document.organizationId,
      documentId: parsed.data.documentId,
      pageNumber: parsed.data.pageNumber,
      kind: parsed.data.kind,
      payloadJson: {
        rect: parsed.data.rect,
        textContent:
          parsed.data.kind === "TEXT"
            ? parsed.data.textContent && parsed.data.textContent.trim().length > 0
              ? parsed.data.textContent
              : "Edit text"
            : undefined,
        imageSrc: parsed.data.kind === "IMAGE" ? parsed.data.imageSrc : undefined,
        textStyle: {
          color: parsed.data.textStyle?.color ?? "#111827",
          fontSizePx: parsed.data.textStyle?.fontSizePx ?? 16,
        },
        opacity: parsed.data.opacity ?? 1,
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
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
    },
    { status: 201 },
  );
}
