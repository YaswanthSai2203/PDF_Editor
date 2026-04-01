import { NextResponse } from "next/server";

import { updateCommentRequestSchema } from "@/features/collaboration/services/collaboration-api.types";
import { prisma } from "@/lib/prisma";

interface CommentRouteContext {
  params: Promise<{
    commentId: string;
  }>;
}

export async function PATCH(request: Request, context: CommentRouteContext) {
  const { commentId } = await context.params;
  const payload = await request.json();
  const parsed = updateCommentRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid comment update payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      body: parsed.data.body,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    data: {
      id: updated.id,
      documentId: updated.documentId,
      authorUserId: updated.authorUserId,
      body: updated.body,
      pageNumber: updated.pageNumber,
      anchorJson: updated.anchorJson,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}

export async function DELETE(_request: Request, context: CommentRouteContext) {
  const { commentId } = await context.params;

  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  return NextResponse.json({ success: true });
}
