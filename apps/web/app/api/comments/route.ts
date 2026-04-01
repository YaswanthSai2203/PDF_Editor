import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import {
  createCommentRequestSchema,
  listCommentsQuerySchema,
} from "@/features/collaboration/services/collaboration-api.types";
import { prisma } from "@/lib/prisma";

function mapCommentRecord(
  record: {
    id: string;
    documentId: string;
    body: string;
    pageNumber: number | null;
    anchorJson: unknown;
    createdAt: Date;
    updatedAt: Date;
  },
) {
  return {
    id: record.id,
    documentId: record.documentId,
    body: record.body,
    pageNumber: record.pageNumber,
    anchorJson: record.anchorJson,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = listCommentsQuerySchema.safeParse({
    documentId: searchParams.get("documentId"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid comments query.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const comments = await prisma.comment.findMany({
    where: { documentId: parsed.data.documentId },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({
    data: comments.map((item) => mapCommentRecord(item)),
  });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createCommentRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid comment payload.", details: parsed.error.flatten() },
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
  const created = await prisma.comment.create({
    data: {
      organizationId: document.organizationId,
      documentId: document.id,
      authorUserId: null,
      body: parsed.data.body,
      pageNumber: parsed.data.pageNumber ?? null,
      anchorJson: parsed.data.anchorJson as Prisma.InputJsonValue | undefined,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.activityEvent.create({
    data: {
      organizationId: document.organizationId,
      documentId: document.id,
      actorUserId: null,
      type: "COMMENT_ADDED",
      payloadJson: {
        commentId: created.id,
        pageNumber: created.pageNumber,
      },
    },
  });

  return NextResponse.json(
    {
      data: mapCommentRecord(created),
    },
    { status: 201 },
  );
}
