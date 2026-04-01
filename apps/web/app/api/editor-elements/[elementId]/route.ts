import { NextResponse } from "next/server";

import { updateEditorElementRequestSchema } from "@/features/editor/services/editor-api.types";
import { prisma } from "@/lib/prisma";

interface EditorElementRouteContext {
  params: Promise<{
    elementId: string;
  }>;
}

export async function PATCH(
  request: Request,
  context: EditorElementRouteContext,
) {
  const { elementId } = await context.params;
  const payload = await request.json();
  const parsed = updateEditorElementRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid editor element update payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.editorElement.findUnique({
    where: { id: elementId },
    select: { id: true, payloadJson: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Editor element not found." }, { status: 404 });
  }

  const previousPayload =
    existing.payloadJson && typeof existing.payloadJson === "object"
      ? (existing.payloadJson as Record<string, unknown>)
      : {};

  const updated = await prisma.editorElement.update({
    where: { id: elementId },
    data: {
      payloadJson: {
        ...previousPayload,
        ...(parsed.data.rect ? { rect: parsed.data.rect } : {}),
        ...(typeof parsed.data.textContent === "string"
          ? { textContent: parsed.data.textContent }
          : {}),
        ...(typeof parsed.data.imageSrc === "string"
          ? { imageSrc: parsed.data.imageSrc }
          : {}),
        ...(parsed.data.textStyle ? { textStyle: parsed.data.textStyle } : {}),
        ...(typeof parsed.data.opacity === "number"
          ? { opacity: parsed.data.opacity }
          : {}),
        ...(typeof parsed.data.syncVersion === "number"
          ? { syncVersion: parsed.data.syncVersion }
          : {}),
      },
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    data: {
      id: updated.id,
      documentId: updated.documentId,
      pageNumber: updated.pageNumber,
      kind: updated.kind,
      payloadJson: updated.payloadJson,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    },
  });
}

export async function DELETE(
  _request: Request,
  context: EditorElementRouteContext,
) {
  const { elementId } = await context.params;

  const existing = await prisma.editorElement.findUnique({
    where: { id: elementId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Editor element not found." }, { status: 404 });
  }

  await prisma.editorElement.update({
    where: { id: elementId },
    data: { deletedAt: new Date(), updatedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
