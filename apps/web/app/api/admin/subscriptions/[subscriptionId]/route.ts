import { NextResponse } from "next/server";

import { updateSubscriptionRequestSchema } from "@/features/admin/services/admin-api.types";
import { prisma } from "@/lib/prisma";

interface SubscriptionRouteContext {
  params: Promise<{
    subscriptionId: string;
  }>;
}

function mapSubscriptionRecord(
  record: {
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
  },
) {
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

export async function PATCH(
  request: Request,
  context: SubscriptionRouteContext,
) {
  const { subscriptionId } = await context.params;
  const payload = await request.json();
  const parsed = updateSubscriptionRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid subscription update payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const existing = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
  }

  const maybeOrganizationUpdate = parsed.data.planTier
    ? { organization: { update: { planTier: parsed.data.planTier } } }
    : {};

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.planTier
        ? { organization: { update: { planTier: parsed.data.planTier } } }
        : {}),
      ...(parsed.data.currentPeriodStart
        ? { currentPeriodStart: new Date(parsed.data.currentPeriodStart) }
        : {}),
      ...(parsed.data.currentPeriodEnd
        ? { currentPeriodEnd: new Date(parsed.data.currentPeriodEnd) }
        : {}),
      ...maybeOrganizationUpdate,
    },
    include: {
      organization: {
        select: {
          planTier: true,
        },
      },
    },
  });

  return NextResponse.json({
    data: {
      ...mapSubscriptionRecord(updated),
      planTier: updated.organization.planTier,
    },
  });
}
