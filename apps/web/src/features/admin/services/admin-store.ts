"use client";

import { create } from "zustand";

import type {
  TeamMemberEntity,
  SubscriptionEntity,
  EntitlementEntity,
} from "@/features/admin/domain/admin";

interface AdminStoreState {
  membershipsByDocument: Record<string, TeamMemberEntity[]>;
  subscriptionsByDocument: Record<string, SubscriptionEntity[]>;
  entitlementsByDocument: Record<string, EntitlementEntity[]>;
  setDocumentMemberships: (
    documentKey: string,
    memberships: TeamMemberEntity[],
  ) => void;
  setDocumentSubscriptions: (
    documentKey: string,
    subscriptions: SubscriptionEntity[],
  ) => void;
  setDocumentEntitlements: (
    documentKey: string,
    entitlements: EntitlementEntity[],
  ) => void;
  upsertMembership: (documentKey: string, membership: TeamMemberEntity) => void;
  upsertSubscription: (
    documentKey: string,
    subscription: SubscriptionEntity,
  ) => void;
  upsertEntitlement: (documentKey: string, entitlement: EntitlementEntity) => void;
}

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const index = list.findIndex((entry) => entry.id === item.id);
  if (index === -1) {
    return [item, ...list];
  }
  return list.map((entry) => (entry.id === item.id ? item : entry));
}

export const useAdminStore = create<AdminStoreState>((set) => ({
  membershipsByDocument: {},
  subscriptionsByDocument: {},
  entitlementsByDocument: {},

  setDocumentMemberships: (documentKey, memberships) => {
    set((state) => ({
      membershipsByDocument: {
        ...state.membershipsByDocument,
        [documentKey]: memberships,
      },
    }));
  },

  setDocumentSubscriptions: (documentKey, subscriptions) => {
    set((state) => ({
      subscriptionsByDocument: {
        ...state.subscriptionsByDocument,
        [documentKey]: subscriptions,
      },
    }));
  },

  setDocumentEntitlements: (documentKey, entitlements) => {
    set((state) => ({
      entitlementsByDocument: {
        ...state.entitlementsByDocument,
        [documentKey]: entitlements,
      },
    }));
  },

  upsertMembership: (documentKey, membership) => {
    set((state) => ({
      membershipsByDocument: {
        ...state.membershipsByDocument,
        [documentKey]: upsertById(
          state.membershipsByDocument[documentKey] ?? [],
          membership,
        ),
      },
    }));
  },

  upsertSubscription: (documentKey, subscription) => {
    set((state) => ({
      subscriptionsByDocument: {
        ...state.subscriptionsByDocument,
        [documentKey]: upsertById(
          state.subscriptionsByDocument[documentKey] ?? [],
          subscription,
        ),
      },
    }));
  },

  upsertEntitlement: (documentKey, entitlement) => {
    set((state) => ({
      entitlementsByDocument: {
        ...state.entitlementsByDocument,
        [documentKey]: upsertById(
          state.entitlementsByDocument[documentKey] ?? [],
          entitlement,
        ),
      },
    }));
  },
}));
