import { beforeEach, describe, expect, it } from "vitest";

import type {
  EntitlementEntity,
  MembershipEntity,
  SubscriptionEntity,
} from "@/features/admin/domain/admin";
import { useAdminStore } from "@/features/admin/services/admin-store";

describe("useAdminStore", () => {
  beforeEach(() => {
    useAdminStore.setState({
      membershipsByDocument: {},
      subscriptionsByDocument: {},
      entitlementsByDocument: {},
    });
  });

  it("sets and upserts memberships by document key", () => {
    const documentKey = "/viewer/demo.pdf";
    const initial: MembershipEntity = {
      id: "m1",
      organizationId: "org-1",
      userId: "u1",
      email: "first@example.com",
      role: "EDITOR",
      createdAt: new Date().toISOString(),
    };
    useAdminStore.getState().setDocumentMemberships(documentKey, [initial]);
    expect(useAdminStore.getState().membershipsByDocument[documentKey]).toHaveLength(1);

    const updated: MembershipEntity = {
      ...initial,
      role: "ADMIN",
    };
    useAdminStore.getState().upsertMembership(documentKey, updated);
    const members = useAdminStore.getState().membershipsByDocument[documentKey];
    expect(members).toHaveLength(1);
    expect(members[0]?.role).toBe("ADMIN");
  });

  it("upserts subscriptions and entitlements", () => {
    const documentKey = "/viewer/demo.pdf";
    const subscription: SubscriptionEntity = {
      id: "s1",
      organizationId: "org-1",
      provider: "mock",
      providerCustomerId: "cust_1",
      providerSubscriptionId: "sub_1",
      status: "ACTIVE",
      planTier: "PRO",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const entitlement: EntitlementEntity = {
      id: "e1",
      organizationId: "org-1",
      featureKey: "ai.assistant",
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useAdminStore.getState().upsertSubscription(documentKey, subscription);
    useAdminStore.getState().upsertEntitlement(documentKey, entitlement);

    expect(useAdminStore.getState().subscriptionsByDocument[documentKey]?.[0]?.id).toBe(
      "s1",
    );
    expect(useAdminStore.getState().entitlementsByDocument[documentKey]?.[0]?.enabled).toBe(
      true,
    );
  });
});
