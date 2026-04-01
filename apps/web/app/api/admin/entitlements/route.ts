import { NextResponse } from "next/server";

import {
  listOrganizationQuerySchema,
  createEntitlementRequestSchema,
} from "@/features/admin/services/admin-api.types";
import { prisma } from "@/lib/prisma";

async function resolveOrganizationId(input: {
  organizationId?: string;
  documentId?: string;
}): Promise<string | null> {
  if (input.organizationId) {
    return input.organizationId;
  }
  if (!input.documentId) {
    return null;
  }
  const document = await prisma.document.findUnique({
    where: { id: input.documentId },
    select: { organizationId: true },
  });
  return document?.organizationId ?? null;
}

function mapEntitlementRecord(record: {
  id: string;
  organizationId: string;
  featureKey: string;
  enabled: boolean;
  limitValue: number | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: record.id,
    organizationId: record.organizationId,
    featureKey: record.featureKey,
    enabled: record.enabled,
    limitValue: record.limitValue,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = listOrganizationQuerySchema.safeParse({
    organizationId: searchParams.get("organizationId"),
    documentId: searchParams.get("documentId"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid entitlements query.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const organizationId = await resolveOrganizationId(parsed.data);
  if (!organizationId) {
    return NextResponse.json(
      { error: "Organization could not be resolved from query." },
      { status: 404 },
    );
  }

  const entitlements = await prisma.entitlement.findMany({
    where: { organizationId },
    orderBy: [{ featureKey: "asc" }],
  });

  return NextResponse.json({
    data: entitlements.map((item) => mapEntitlementRecord(item)),
  });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createEntitlementRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid entitlement payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const organizationId = await resolveOrganizationId(parsed.data);
  if (!organizationId) {
    return NextResponse.json(
      { error: "Organization could not be resolved from payload." },
      { status: 404 },
    );
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  });

  if (!organization) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  const created = await prisma.entitlement.upsert({
    where: {
      organizationId_featureKey: {
        organizationId,
        featureKey: parsed.data.featureKey,
      },
    },
    update: {
      enabled: parsed.data.enabled,
      limitValue: parsed.data.limitValue ?? null,
      updatedAt: new Date(),
    },
    create: {
      organizationId,
      featureKey: parsed.data.featureKey,
      enabled: parsed.data.enabled,
      limitValue: parsed.data.limitValue ?? null,
    },
  });

  return NextResponse.json(
    {
      data: mapEntitlementRecord(created),
    },
    { status: 201 },
  );
}
