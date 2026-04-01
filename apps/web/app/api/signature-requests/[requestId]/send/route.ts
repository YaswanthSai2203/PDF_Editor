import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

interface SignatureSendRouteContext {
  params: Promise<{
    requestId: string;
  }>;
}

export async function POST(
  _request: Request,
  context: SignatureSendRouteContext,
) {
  const { requestId } = await context.params;

  const existing = await prisma.signatureRequest.findUnique({
    where: { id: requestId },
    include: {
      recipients: {
        where: { status: "PENDING" },
        select: { id: true },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Signature request not found." }, { status: 404 });
  }

  if (existing.recipients.length === 0) {
    return NextResponse.json(
      { error: "Add at least one recipient before sending." },
      { status: 400 },
    );
  }

  const updated = await prisma.signatureRequest.update({
    where: { id: requestId },
    data: {
      status: "SENT",
      updatedAt: new Date(),
    },
    include: {
      recipients: {
        orderBy: { signingOrder: "asc" },
      },
    },
  });

  return NextResponse.json({
    data: {
      id: updated.id,
      documentId: updated.documentId,
      title: updated.title,
      message: updated.message,
      status: updated.status,
      expiresAt: updated.expiresAt?.toISOString() ?? null,
      completedAt: updated.completedAt?.toISOString() ?? null,
      recipients: updated.recipients.map((recipient) => ({
        id: recipient.id,
        signatureRequestId: recipient.signatureRequestId,
        email: recipient.email,
        displayName: recipient.displayName,
        signingOrder: recipient.signingOrder,
        status: recipient.status,
        openedAt: recipient.openedAt?.toISOString() ?? null,
        signedAt: recipient.signedAt?.toISOString() ?? null,
        declinedReason: recipient.declinedReason,
        createdAt: recipient.createdAt.toISOString(),
        updatedAt: recipient.updatedAt.toISOString(),
      })),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}
