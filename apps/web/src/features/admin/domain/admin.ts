export type PlanTier = "FREE" | "PRO" | "ENTERPRISE";
export type MembershipRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";

export interface TeamMemberEntity {
  id: string;
  organizationId: string;
  userId: string;
  email: string;
  name?: string;
  role: MembershipRole;
  createdAt: string;
}

export interface SubscriptionEntity {
  id: string;
  organizationId: string;
  provider: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  status: string;
  planTier: PlanTier;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EntitlementEntity {
  id: string;
  organizationId: string;
  featureKey: string;
  enabled: boolean;
  limitValue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BillingSummaryEntity {
  organizationId: string;
  planTier: PlanTier;
  activeSubscription?: SubscriptionEntity;
  entitlements: EntitlementEntity[];
}

export type MembershipEntity = TeamMemberEntity;
export type AdminMembershipEntity = TeamMemberEntity;
export type AdminSubscriptionEntity = SubscriptionEntity;
export type AdminEntitlementEntity = EntitlementEntity;
