/**
 * AnnotationRepository — DB access for Annotations and their replies.
 */

import type { Prisma } from "@prisma/client";
import { db } from "@/db";

export interface AnnotationRow {
  id: string;
  documentId: string;
  userId: string;
  page: number;
  type: string;
  data: Record<string, unknown>;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  };
  replies?: ReplyRow[];
}

export interface ReplyRow {
  id: string;
  annotationId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export interface CreateAnnotationInput {
  id?: string;
  documentId: string;
  userId: string;
  page: number;
  type: string;
  data: Record<string, unknown>;
}

export const annotationRepository = {
  async listForDocument(
    documentId: string,
    includeResolved = false
  ): Promise<AnnotationRow[]> {
    const annotations = await db.annotation.findMany({
      where: {
        documentId,
        deletedAt: null,
        ...(includeResolved ? {} : {}),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        replies: {
          where: { },
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ page: "asc" }, { createdAt: "asc" }],
    });

    return annotations as unknown as AnnotationRow[];
  },

  async findById(id: string): Promise<AnnotationRow | null> {
    const annotation = await db.annotation.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, image: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return annotation as unknown as AnnotationRow | null;
  },

  async create(input: CreateAnnotationInput): Promise<AnnotationRow> {
    const annotation = await db.annotation.create({
      data: {
        id: input.id,
        documentId: input.documentId,
        userId: input.userId,
        page: input.page,
        type: input.type as never,
        data: input.data as Prisma.InputJsonValue,
        isResolved: false,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        replies: true,
      },
    });

    return annotation as unknown as AnnotationRow;
  },

  async upsertMany(
    documentId: string,
    userId: string,
    annotations: CreateAnnotationInput[]
  ): Promise<void> {
    await db.$transaction(
      annotations.map((a) =>
        db.annotation.upsert({
          where: { id: a.id ?? "" },
          update: {
            page: a.page,
            type: a.type as never,
            data: a.data as Prisma.InputJsonValue,
          },
          create: {
            id: a.id,
            documentId,
            userId,
            page: a.page,
            type: a.type as never,
            data: a.data as Prisma.InputJsonValue,
            isResolved: false,
          },
        })
      )
    );
  },

  async update(
    id: string,
    userId: string,
    input: { data?: Record<string, unknown>; isResolved?: boolean }
  ): Promise<AnnotationRow | null> {
    const existing = await db.annotation.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!existing) return null;

    const updated = await db.annotation.update({
      where: { id },
      data: {
        ...(input.data !== undefined
          ? { data: input.data as Prisma.InputJsonValue }
          : {}),
        ...(input.isResolved !== undefined
          ? { isResolved: input.isResolved }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        replies: true,
      },
    });

    return updated as unknown as AnnotationRow;
  },

  async softDelete(id: string, userId: string): Promise<boolean> {
    const existing = await db.annotation.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!existing) return false;

    await db.annotation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  },

  async addReply(
    annotationId: string,
    userId: string,
    content: string
  ): Promise<ReplyRow> {
    const reply = await db.annotationReply.create({
      data: { annotationId, userId, content },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return reply as unknown as ReplyRow;
  },

  async deleteReply(replyId: string, userId: string): Promise<boolean> {
    const reply = await db.annotationReply.findFirst({
      where: { id: replyId, userId },
    });
    if (!reply) return false;

    await db.annotationReply.delete({ where: { id: replyId } });
    return true;
  },
};
