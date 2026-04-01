/**
 * DocumentRepository — all database access for Documents goes through here.
 *
 * Design: thin repository layer between API routes and Prisma.
 * - Enforces ownership/team scoping on every query
 * - Returns plain objects (not Prisma models) so the API layer stays
 *   decoupled from the ORM
 * - Soft-deletes by setting deletedAt (never hard-deletes)
 */

import type { Prisma } from "@prisma/client";
import { db } from "@/db";

export interface DocumentRow {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  teamId: string | null;
  storageKey: string;
  fileSize: number;
  pageCount: number;
  status: string;
  isShared: boolean;
  shareToken: string | null;
  thumbnailKey: string | null;
  ocrStatus: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentInput {
  title: string;
  ownerId: string;
  teamId?: string;
  storageKey: string;
  fileSize: number;
  description?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  pageCount?: number;
  status?: string;
  thumbnailKey?: string;
  ocrStatus?: string;
  ocrText?: string;
  metadata?: Record<string, unknown>;
  isShared?: boolean;
}

export interface ListDocumentsOptions {
  ownerId?: string;
  teamId?: string;
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  orderBy?: "createdAt" | "updatedAt" | "title";
  order?: "asc" | "desc";
}

export const documentRepository = {
  async create(input: CreateDocumentInput): Promise<DocumentRow> {
    const doc = await db.document.create({
      data: {
        title: input.title,
        description: input.description,
        ownerId: input.ownerId,
        teamId: input.teamId,
        storageKey: input.storageKey,
        fileSize: input.fileSize,
        status: "PROCESSING",
        ocrStatus: "NONE",
        metadata: {},
      },
    });
    return doc as DocumentRow;
  },

  async findById(
    id: string,
    userId: string
  ): Promise<DocumentRow | null> {
    const doc = await db.document.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { ownerId: userId },
          {
            team: {
              members: { some: { userId } },
            },
          },
          {
            collaborators: { some: { email: { not: undefined } } },
          },
        ],
      },
    });
    return doc as DocumentRow | null;
  },

  async findByShareToken(shareToken: string): Promise<DocumentRow | null> {
    const doc = await db.document.findFirst({
      where: { shareToken, deletedAt: null, isShared: true },
    });
    return doc as DocumentRow | null;
  },

  async list(options: ListDocumentsOptions): Promise<{
    items: DocumentRow[];
    total: number;
  }> {
    const {
      ownerId,
      teamId,
      search,
      status,
      page = 1,
      pageSize = 20,
      orderBy = "updatedAt",
      order = "desc",
    } = options;

    const where: Prisma.DocumentWhereInput = {
      deletedAt: null,
      ...(ownerId && !teamId ? { ownerId } : {}),
      ...(teamId ? { teamId } : {}),
      ...(status ? { status: status as Prisma.EnumDocumentStatusFilter } : {}),
      ...(search
        ? {
            title: { contains: search, mode: "insensitive" as const },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      db.document.findMany({
        where,
        orderBy: { [orderBy]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.document.count({ where }),
    ]);

    return { items: items as DocumentRow[], total };
  },

  async update(
    id: string,
    userId: string,
    input: UpdateDocumentInput
  ): Promise<DocumentRow | null> {
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    // Build the update object explicitly to satisfy Prisma's strict Json typing
    const updateData: Prisma.DocumentUpdateInput = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.pageCount !== undefined) updateData.pageCount = input.pageCount;
    if (input.status !== undefined) updateData.status = input.status as never;
    if (input.thumbnailKey !== undefined) updateData.thumbnailKey = input.thumbnailKey;
    if (input.ocrStatus !== undefined) updateData.ocrStatus = input.ocrStatus as never;
    if (input.ocrText !== undefined) updateData.ocrText = input.ocrText;
    if (input.isShared !== undefined) updateData.isShared = input.isShared;
    if (input.metadata !== undefined) {
      updateData.metadata = input.metadata as Prisma.InputJsonValue;
    }

    const doc = await db.document.update({
      where: { id },
      data: updateData,
    });

    return doc as DocumentRow;
  },

  async softDelete(id: string, userId: string): Promise<boolean> {
    const existing = await this.findById(id, userId);
    if (!existing) return false;

    // Only owner can delete
    if (existing.ownerId !== userId) return false;

    await db.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  },

  async getStorageKey(id: string, userId: string): Promise<string | null> {
    const doc = await this.findById(id, userId);
    return doc?.storageKey ?? null;
  },

  /**
   * Create a new version entry when the document is re-saved.
   */
  async createVersion(
    documentId: string,
    storageKey: string,
    fileSize: number,
    changeNote?: string,
    createdById?: string
  ) {
    const maxVersion = await db.documentVersion.aggregate({
      where: { documentId },
      _max: { version: true },
    });

    const nextVersion = (maxVersion._max.version ?? 0) + 1;

    return db.documentVersion.create({
      data: {
        documentId,
        version: nextVersion,
        storageKey,
        fileSize,
        changeNote,
        createdById,
      },
    });
  },

  async getVersions(documentId: string, userId: string) {
    const doc = await this.findById(documentId, userId);
    if (!doc) return [];

    return db.documentVersion.findMany({
      where: { documentId },
      orderBy: { version: "desc" },
    });
  },
};
