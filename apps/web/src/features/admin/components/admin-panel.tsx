"use client";

import { Shield, Users, CreditCard, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  AdminEntitlementEntity,
  AdminMembershipEntity,
  PlanTier,
  AdminSubscriptionEntity,
} from "@/features/admin/domain/admin";

interface AdminPanelProps {
  canPersist: boolean;
  memberships: AdminMembershipEntity[];
  subscriptions: AdminSubscriptionEntity[];
  entitlements: AdminEntitlementEntity[];
  onRefresh: () => void;
  onCreateMembership: (input: {
    email: string;
    role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
  }) => void;
  onUpdateMembership: (
    membershipId: string,
    role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER",
  ) => void;
  onCreateSubscription: (input: {
    provider: string;
    providerCustomerId: string;
    providerSubscriptionId: string;
    status: string;
    planTier: PlanTier;
  }) => void;
  onUpdateSubscription: (
    subscriptionId: string,
    planTier: PlanTier,
    status: string,
  ) => void;
  onUpsertEntitlement: (input: {
    featureKey: string;
    enabled: boolean;
    limitValue?: number;
  }) => void;
}

const defaultFeatures = [
  "pdf.editing.advanced",
  "ocr.pipeline",
  "signature.workflows",
  "ai.assistant",
  "audit.logs",
];

export function AdminPanel({
  canPersist,
  memberships,
  subscriptions,
  entitlements,
  onRefresh,
  onCreateMembership,
  onUpdateMembership,
  onCreateSubscription,
  onUpdateSubscription,
  onUpsertEntitlement,
}: AdminPanelProps) {
  const activeSubscription = subscriptions[0] ?? null;
  const entitlementByFeature = new Map(
    entitlements.map((entitlement) => [entitlement.featureKey, entitlement]),
  );

  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <div className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            <Shield className="h-4 w-4" />
            Admin & Billing
          </h3>
          <Button size="sm" variant="outline" onClick={onRefresh} disabled={!canPersist}>
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            className="gap-1"
            disabled={!canPersist}
            onClick={() =>
              onCreateMembership({
                email: `member+${Date.now().toString().slice(-6)}@example.com`,
                role: "EDITOR",
              })
            }
          >
            <Users className="h-4 w-4" />
            Add member
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            disabled={!canPersist}
            onClick={() => {
              if (activeSubscription) {
                onUpdateSubscription(
                  activeSubscription.id,
                  activeSubscription.planTier === "PRO" ? "ENTERPRISE" : "PRO",
                  "ACTIVE",
                );
                return;
              }
              onCreateSubscription({
                provider: "mock-billing",
                providerCustomerId: `cust_${Date.now().toString()}`,
                providerSubscriptionId: `sub_${Date.now().toString()}`,
                status: "ACTIVE",
                planTier: "PRO",
              });
            }}
          >
            <CreditCard className="h-4 w-4" />
            Upgrade plan
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 grid-rows-[220px_170px_1fr]">
        <section className="overflow-y-auto border-b border-zinc-200 p-3 dark:border-zinc-800">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            Team members
          </h4>
          {memberships.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No members yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {memberships.map((member) => (
                <li
                  key={member.id}
                  className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <div className="font-medium text-zinc-800 dark:text-zinc-100">
                    {member.email}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                    <span>{member.role}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[10px]"
                      disabled={!canPersist}
                      onClick={() =>
                        onUpdateMembership(
                          member.id,
                          member.role === "EDITOR" ? "ADMIN" : "EDITOR",
                        )
                      }
                    >
                      Toggle role
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-y-auto border-b border-zinc-200 p-3 dark:border-zinc-800">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            Subscription
          </h4>
          {!activeSubscription ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">No subscription.</p>
          ) : (
            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs dark:border-zinc-700 dark:bg-zinc-900">
              <p className="font-medium text-zinc-800 dark:text-zinc-100">
                Plan: {activeSubscription.planTier}
              </p>
              <p className="text-zinc-500 dark:text-zinc-400">
                Status: {activeSubscription.status}
              </p>
            </div>
          )}
        </section>

        <section className="overflow-y-auto p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            Entitlements
          </h4>
          <div className="space-y-2">
            {defaultFeatures.map((featureKey) => {
              const entitlement = entitlementByFeature.get(featureKey);
              const enabled = entitlement?.enabled ?? false;
              return (
                <div
                  key={featureKey}
                  className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <div className="text-zinc-700 dark:text-zinc-200">{featureKey}</div>
                  <Button
                    size="sm"
                    variant={enabled ? "secondary" : "outline"}
                    className="h-7 px-2 text-[10px]"
                    disabled={!canPersist}
                    onClick={() =>
                      onUpsertEntitlement({
                        featureKey,
                        enabled: !enabled,
                        limitValue: entitlement?.limitValue,
                      })
                    }
                  >
                    <Save className="mr-1 h-3 w-3" />
                    {enabled ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
