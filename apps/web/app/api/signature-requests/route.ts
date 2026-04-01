import { NextResponse } from "next/server";
import { SignatureRequestStatus } from "@prisma/client";

import {
  createSignatureRequestSchema,
  listSignatureRequestsQuerySchema,
} from "@/features/signature/services/signature-api.types";
import { prisma } from "@/lib/prisma";

function mapRequestRecord(
  request: {
    id: string;
    documentId: string;
    title: string;
    status: SignatureRequestStatus;
    message: string | null;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
    expiresAt: Date | null;
    recipients: Array<{
      id: string;
      signatureRequestId: string;
      email: string;
      displayName: string | null;
      signingOrder: number;
      status: "PENDING" | "OPENED" | "SIGNED" | "DECLINED";
      openedAt: Date | null;
      signedAt: Date | null;
      declinedReason: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
  },
) {
  return {
    id: request.id,
    documentId: request.documentId,
    title: request.title,
    status: request.status,
    message: request.message,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    completedAt: request.completedAt?.toISOString() ?? null,
    expiresAt: request.expiresAt?.toISOString() ?? null,
    recipients: request.recipients.map((recipient) => ({
      id: recipient.id,
      signatureRequestId: recipient.signatureRequestId,
      email: recipient.email,
      displayName: recipient.displayName,
      signingOrder: recipient.signingOrder,
      status: recipient.status,
      openedAt: recipient.openedAt?.toISOString() ?? null,
      signedAt: recipient.signedAt?.toISOString() ?? null,
      declinedReason: recipient.declinedReason ?? null,
      createdAt: recipient.createdAt.toISOString(),
      updatedAt: recipient.updatedAt.toISOString(),
    })),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = listSignatureRequestsQuerySchema.safeParse({
    documentId: searchParams.get("documentId"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid signature request query.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const requests = await prisma.signatureRequest.findMany({
    where: {
      documentId: parsed.data.documentId,
    },
    include: {
      recipients: {
        orderBy: { signingOrder: "asc" },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({
    data: requests.map((item: (typeof requests)[number]) => mapRequestRecord(item)),
  });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createSignatureRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid signature request payload.", details: parsed.error.flatten() },
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
  const created = await prisma.signatureRequest.create({
    data: {
      organizationId: document.organizationId,
      documentId: parsed.data.documentId,
      title: parsed.data.title,
      message: parsed.data.message,
      status: SignatureRequestStatus.DRAFT,
      createdByUserId: null,
      createdAt: now,
      updatedAt: now,
      recipients: {
        create: parsed.data.recipients.map((recipient, index) => ({
          email: recipient.email,
          displayName: recipient.displayName,
          signingOrder: index + 1,
        })),
      },
    },
    include: {
      recipients: {
        orderBy: { signingOrder: "asc" },
      },
    },
  });

  return NextResponse.json(
    {
      data: mapRequestRecord(created),
    },
    { status: 201 },
  );
}
