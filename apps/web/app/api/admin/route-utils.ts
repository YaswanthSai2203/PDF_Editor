import { prisma } from "@/lib/prisma";

interface OrganizationLookupInput {
  organizationId?: string | null;
  documentId?: string | null;
}

export function resolveOrganizationIdInput(input: OrganizationLookupInput): {
  organizationId?: string;
  documentId?: string;
} {
  const organizationId = input.organizationId?.trim() || undefined;
  const documentId = input.documentId?.trim() || undefined;

  if (!organizationId && !documentId) {
    throw new Error("organizationId or documentId is required.");
  }

  return {
    organizationId,
    documentId,
  };
}

export async function resolveOrganizationId(
  input: OrganizationLookupInput,
): Promise<string | null> {
  const normalized = resolveOrganizationIdInput(input);
  if (normalized.organizationId) {
    return normalized.organizationId;
  }
  if (!normalized.documentId) {
    return null;
  }

  const document = await prisma.document.findUnique({
    where: { id: normalized.documentId },
    select: { organizationId: true },
  });
  return document?.organizationId ?? null;
}
