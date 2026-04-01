import { NextResponse } from "next/server";
import { DocumentVersionSource } from "@prisma/client";

import {
  createDocumentVersionRequestSchema,
  listDocumentVersionsQuerySchema,
} from "@/features/collaboration/services/collaboration-api.types";
import { prisma } from "@/lib/prisma";

function mapVersionRecord(
  version: {
    id: string;
    documentId: string;
    versionNumber: number;
    source: DocumentVersionSource;
    storageKey: string;
    checksumSha256: string;
    pageCount: number;
    createdAt: Date;
    metadataJson: unknown;
  },
) {
  return {
    id: version.id,
    documentId: version.documentId,
    versionNumber: version.versionNumber,
    source: version.source,
    storageKey: version.storageKey,
    checksumSha256: version.checksumSha256,
    pageCount: version.pageCount,
    metadataJson: version.metadataJson,
    createdAt: version.createdAt.toISOString(),
    isCurrent: false,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = listDocumentVersionsQuerySchema.safeParse({
    documentId: searchParams.get("documentId"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid document versions query.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const versions = await prisma.documentVersion.findMany({
    where: {
      documentId: parsed.data.documentId,
    },
    orderBy: [{ versionNumber: "desc" }],
  });

  const currentVersionId = versions[0]?.id ?? null;
  return NextResponse.json({
    data: versions.map((version) => ({
      ...mapVersionRecord(version),
      isCurrent: version.id === currentVersionId,
    })),
  });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createDocumentVersionRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid document version payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const document = await prisma.document.findUnique({
    where: { id: parsed.data.documentId },
    select: {
      id: true,
      organizationId: true,
      versions: {
        select: { versionNumber: true },
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const nextVersion = (document.versions[0]?.versionNumber ?? 0) + 1;
  const created = await prisma.documentVersion.create({
    data: {
      documentId: document.id,
      organizationId: document.organizationId,
      versionNumber: nextVersion,
      source: parsed.data.source as DocumentVersionSource,
      storageKey: parsed.data.storageKey,
      checksumSha256: parsed.data.checksumSha256,
      pageCount: parsed.data.pageCount,
      metadataJson:
        parsed.data.metadataJson === undefined
          ? undefined
          : (parsed.data.metadataJson as unknown as object),
      createdByUserId: null,
    },
  });

  await prisma.document.update({
    where: { id: document.id },
    data: { currentVersionId: created.id, updatedAt: new Date() },
  });

  await prisma.activityEvent.create({
    data: {
      organizationId: document.organizationId,
      documentId: document.id,
      actorUserId: null,
      type: "DOCUMENT_VERSION_CREATED",
      payloadJson: {
        versionId: created.id,
        versionNumber: created.versionNumber,
        source: created.source,
      },
    },
  });

  return NextResponse.json(
    {
      data: {
        ...mapVersionRecord(created),
        isCurrent: true,
      },
    },
    { status: 201 },
  );
}
