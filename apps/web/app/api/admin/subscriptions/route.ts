import { NextResponse } from "next/server";

import {
  createSubscriptionRequestSchema,
  listOrganizationQuerySchema,
} from "@/features/admin/services/admin-api.types";
import { resolveOrganizationId } from "../route-utils";
import { prisma } from "@/lib/prisma";

function mapSubscriptionRecord(record: {
  id: string;
  organizationId: string;
  provider: string;
  providerCustomerId: string;
  providerSubscriptionId: string;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: record.id,
    organizationId: record.organizationId,
    provider: record.provider,
    providerCustomerId: record.providerCustomerId,
    providerSubscriptionId: record.providerSubscriptionId,
    status: record.status,
    currentPeriodStart: record.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: record.currentPeriodEnd?.toISOString() ?? null,
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
      { error: "Invalid subscriptions query.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const resolvedOrganizationId = await resolveOrganizationId(parsed.data);

  if (!resolvedOrganizationId) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  const subscriptions = await prisma.subscription.findMany({
    where: {
      organizationId: resolvedOrganizationId,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({
    data: subscriptions.map((record) => mapSubscriptionRecord(record)),
  });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createSubscriptionRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid subscription payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const resolvedOrganizationId = await resolveOrganizationId(parsed.data);

  if (!resolvedOrganizationId) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  const organization = await prisma.organization.findUnique({
    where: { id: resolvedOrganizationId },
    select: { id: true, planTier: true },
  });

  if (!organization) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  if (organization.planTier !== parsed.data.planTier) {
    await prisma.organization.update({
      where: { id: organization.id },
      data: { planTier: parsed.data.planTier },
    });
  }

  const created = await prisma.subscription.create({
    data: {
      organizationId: resolvedOrganizationId,
      provider: parsed.data.provider,
      providerCustomerId: parsed.data.providerCustomerId,
      providerSubscriptionId: parsed.data.providerSubscriptionId,
      status: parsed.data.status,
      currentPeriodStart: parsed.data.currentPeriodStart
        ? new Date(parsed.data.currentPeriodStart)
        : null,
      currentPeriodEnd: parsed.data.currentPeriodEnd
        ? new Date(parsed.data.currentPeriodEnd)
        : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(
    {
      data: mapSubscriptionRecord(created),
    },
    { status: 201 },
  );
}
