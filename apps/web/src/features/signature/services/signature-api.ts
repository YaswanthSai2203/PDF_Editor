"use client";

import type {
  SignatureRecipientInput,
  SignatureRequestEntity,
  SignatureRequestStatus,
  SignatureRecipientStatus,
} from "@/features/signature/domain/signature-request";

interface SignatureRecipientApiRecord {
  id: string;
  email: string;
  displayName: string | null;
  signingOrder: number;
  status: SignatureRecipientStatus;
  openedAt: string | null;
  signedAt: string | null;
  declinedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SignatureRequestApiRecord {
  id: string;
  documentId: string;
  title: string;
  message: string | null;
  status: SignatureRequestStatus;
  completedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  recipients: SignatureRecipientApiRecord[];
}

interface SignatureRequestApiEnvelope {
  data: SignatureRequestApiRecord;
}

interface SignatureRequestListApiEnvelope {
  data: SignatureRequestApiRecord[];
}

function mapRecipientInput(
  recipients: SignatureRecipientInput[],
): SignatureRecipientInput[] {
  return recipients.map((recipient, index) => ({
    email: recipient.email.trim(),
    displayName: recipient.displayName?.trim() || undefined,
    signingOrder: recipient.signingOrder ?? index + 1,
  }));
}

function mapRecordToEntity(
  record: SignatureRequestApiRecord,
  documentKey: string,
): SignatureRequestEntity {
  return {
    id: record.id,
    documentId: record.documentId,
    documentKey,
    persistedDocumentId: record.documentId,
    persisted: true,
    title: record.title,
    message: record.message ?? undefined,
    status: record.status,
    completedAt: record.completedAt ?? undefined,
    expiresAt: record.expiresAt ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    recipients: record.recipients.map((recipient) => ({
      id: recipient.id,
      signatureRequestId: record.id,
      email: recipient.email,
      displayName: recipient.displayName ?? undefined,
      signingOrder: recipient.signingOrder,
      status: recipient.status,
      openedAt: recipient.openedAt ?? undefined,
      signedAt: recipient.signedAt ?? undefined,
      declinedReason: recipient.declinedReason ?? undefined,
      createdAt: recipient.createdAt,
      updatedAt: recipient.updatedAt,
    })),
  };
}

export async function fetchSignatureRequests(
  documentId: string,
  documentKey: string,
): Promise<SignatureRequestEntity[]> {
  const response = await fetch(
    `/api/signature-requests?documentId=${encodeURIComponent(documentId)}`,
    { method: "GET" },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch signature requests.");
  }
  const json = (await response.json()) as SignatureRequestListApiEnvelope;
  return json.data.map((item) => mapRecordToEntity(item, documentKey));
}

export async function createSignatureRequestOnServer(input: {
  documentId: string;
  documentKey: string;
  title: string;
  message?: string;
  recipients: SignatureRecipientInput[];
  expiresAt?: string;
}): Promise<SignatureRequestEntity> {
  const response = await fetch("/api/signature-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentId: input.documentId,
      title: input.title,
      message: input.message,
      expiresAt: input.expiresAt,
      recipients: mapRecipientInput(input.recipients),
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create signature request.");
  }

  const json = (await response.json()) as SignatureRequestApiEnvelope;
  return mapRecordToEntity(json.data, input.documentKey);
}

export async function updateSignatureRequestOnServer(
  signatureRequestId: string,
  documentKey: string,
  input: {
    title?: string;
    message?: string;
    recipients?: SignatureRecipientInput[];
    expiresAt?: string;
  },
): Promise<SignatureRequestEntity> {
  const response = await fetch(
    `/api/signature-requests/${encodeURIComponent(signatureRequestId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        recipients: input.recipients ? mapRecipientInput(input.recipients) : undefined,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to update signature request.");
  }

  const json = (await response.json()) as SignatureRequestApiEnvelope;
  return mapRecordToEntity(json.data, documentKey);
}

export async function sendSignatureRequestOnServer(
  signatureRequestId: string,
  documentKey: string,
): Promise<SignatureRequestEntity> {
  const response = await fetch(
    `/api/signature-requests/${encodeURIComponent(signatureRequestId)}/send`,
    {
      method: "POST",
    },
  );
  if (!response.ok) {
    throw new Error("Failed to send signature request.");
  }
  const json = (await response.json()) as SignatureRequestApiEnvelope;
  return mapRecordToEntity(json.data, documentKey);
}
