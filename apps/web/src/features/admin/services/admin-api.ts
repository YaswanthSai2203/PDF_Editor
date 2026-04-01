"use client";

import type {
  EntitlementEntity,
  MembershipEntity,
  MembershipRole,
  PlanTier,
  SubscriptionEntity,
} from "@/features/admin/domain/admin";

interface MembershipApiRecord {
  id: string;
  organizationId: string;
  userId: string;
  role: MembershipRole;
  createdAt: string;
  user: {
    email: string;
    name: string | null;
  } | null;
}

interface SubscriptionApiRecord {
  id: string;
  organizationId: string;
  provider: string;
  providerCustomerId: string;
  providerSubscriptionId: string;
  status: string;
  planTier?: PlanTier;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EntitlementApiRecord {
  id: string;
  organizationId: string;
  featureKey: string;
  enabled: boolean;
  limitValue: number | null;
  createdAt: string;
  updatedAt: string;
}

function mapMembership(
  record: MembershipApiRecord,
  organizationId: string,
): MembershipEntity {
  return {
    id: record.id,
    organizationId,
    userId: record.userId,
    email: record.user?.email ?? "",
    name: record.user?.name ?? undefined,
    role: record.role,
    createdAt: record.createdAt,
  };
}

function mapSubscription(
  record: SubscriptionApiRecord,
  organizationId: string,
): SubscriptionEntity {
  return {
    id: record.id,
    organizationId,
    provider: record.provider,
    providerCustomerId: record.providerCustomerId,
    providerSubscriptionId: record.providerSubscriptionId,
    status: record.status,
    planTier: record.planTier ?? "FREE",
    currentPeriodStart: record.currentPeriodStart ?? undefined,
    currentPeriodEnd: record.currentPeriodEnd ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapEntitlement(
  record: EntitlementApiRecord,
  organizationId: string,
): EntitlementEntity {
  return {
    id: record.id,
    organizationId,
    featureKey: record.featureKey,
    enabled: record.enabled,
    limitValue: record.limitValue ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function fetchMemberships(
  organizationId: string,
): Promise<MembershipEntity[]> {
  const response = await fetch(
    `/api/admin/memberships?organizationId=${encodeURIComponent(organizationId)}`,
    { method: "GET" },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch memberships.");
  }
  const json = (await response.json()) as { data: MembershipApiRecord[] };
  return json.data.map((item) => mapMembership(item, organizationId));
}

export async function updateMembershipRoleOnServer(
  membershipId: string,
  role: MembershipRole,
  organizationId: string,
): Promise<MembershipEntity> {
  const response = await fetch(
    `/api/admin/memberships/${encodeURIComponent(membershipId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  );
  if (!response.ok) {
    throw new Error("Failed to update membership role.");
  }
  const json = (await response.json()) as { data: MembershipApiRecord };
  return mapMembership(json.data, organizationId);
}

export async function fetchSubscriptions(
  organizationId: string,
): Promise<SubscriptionEntity[]> {
  const response = await fetch(
    `/api/admin/subscriptions?organizationId=${encodeURIComponent(organizationId)}`,
    { method: "GET" },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch subscriptions.");
  }
  const json = (await response.json()) as { data: SubscriptionApiRecord[] };
  return json.data.map((item) => mapSubscription(item, organizationId));
}

export async function fetchEntitlements(
  organizationId: string,
): Promise<EntitlementEntity[]> {
  const response = await fetch(
    `/api/admin/entitlements?organizationId=${encodeURIComponent(organizationId)}`,
    { method: "GET" },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch entitlements.");
  }
  const json = (await response.json()) as { data: EntitlementApiRecord[] };
  return json.data.map((item) => mapEntitlement(item, organizationId));
}

export async function upsertEntitlementOnServer(input: {
  organizationId: string;
  featureKey: string;
  enabled: boolean;
  limitValue?: number;
}): Promise<EntitlementEntity> {
  const response = await fetch("/api/admin/entitlements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organizationId: input.organizationId,
      featureKey: input.featureKey,
      enabled: input.enabled,
      limitValue: input.limitValue,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to upsert entitlement.");
  }
  const json = (await response.json()) as { data: EntitlementApiRecord };
  return mapEntitlement(json.data, input.organizationId);
}

export async function createMembershipOnServer(input: {
  organizationId: string;
  email: string;
  role: MembershipRole;
}): Promise<MembershipEntity> {
  const response = await fetch("/api/admin/memberships", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("Failed to create membership.");
  }
  const json = (await response.json()) as { data: MembershipApiRecord };
  return mapMembership(json.data, input.organizationId);
}

export async function updateMembershipOnServer(
  membershipId: string,
  role: MembershipRole,
  organizationId: string,
): Promise<MembershipEntity> {
  return updateMembershipRoleOnServer(membershipId, role, organizationId);
}

export async function createSubscriptionOnServer(input: {
  organizationId: string;
  provider: string;
  providerCustomerId: string;
  providerSubscriptionId: string;
  status: string;
  planTier: PlanTier;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}): Promise<SubscriptionEntity> {
  const response = await fetch("/api/admin/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("Failed to create subscription.");
  }
  const json = (await response.json()) as { data: SubscriptionApiRecord };
  return mapSubscription(json.data, input.organizationId);
}

export async function updateSubscriptionOnServer(
  subscriptionId: string,
  planTier: PlanTier,
  status: string,
  organizationId: string,
): Promise<SubscriptionEntity> {
  const response = await fetch(
    `/api/admin/subscriptions/${encodeURIComponent(subscriptionId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planTier, status }),
    },
  );
  if (!response.ok) {
    throw new Error("Failed to update subscription.");
  }
  const json = (await response.json()) as { data: SubscriptionApiRecord };
  return mapSubscription(json.data, organizationId);
}
