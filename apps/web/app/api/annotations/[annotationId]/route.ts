import { NextResponse } from "next/server";

import { updateAnnotationRectRequestSchema } from "@/features/annotation/services/annotation-api.types";
import { prisma } from "@/lib/prisma";

interface AnnotationRouteContext {
  params: Promise<{
    annotationId: string;
  }>;
}

export async function PATCH(
  request: Request,
  context: AnnotationRouteContext,
) {
  const { annotationId } = await context.params;
  const payload = await request.json();
  const parsed = updateAnnotationRectRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid rect payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.annotation.findUnique({
    where: { id: annotationId },
    select: { id: true, payloadJson: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Annotation not found." }, { status: 404 });
  }

  const previousPayload =
    existing.payloadJson && typeof existing.payloadJson === "object"
      ? (existing.payloadJson as Record<string, unknown>)
      : {};

  const updated = await prisma.annotation.update({
    where: { id: annotationId },
    data: {
      payloadJson: {
        ...previousPayload,
        rect: parsed.data.rect,
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
  context: AnnotationRouteContext,
) {
  const { annotationId } = await context.params;

  const existing = await prisma.annotation.findUnique({
    where: { id: annotationId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Annotation not found." }, { status: 404 });
  }

  await prisma.annotation.update({
    where: { id: annotationId },
    data: { deletedAt: new Date(), updatedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
