import { z } from "zod";

const organizationLocatorSchema = z
  .object({
    organizationId: z.string().min(1).optional(),
    documentId: z.string().min(1).optional(),
  })
  .refine((value) => Boolean(value.organizationId || value.documentId), {
    message: "organizationId or documentId is required.",
  });

export const listOrganizationQuerySchema = organizationLocatorSchema;

export const listMembershipsQuerySchema = organizationLocatorSchema;
export const listSubscriptionsQuerySchema = organizationLocatorSchema;
export const listAdminByOrganizationQuerySchema = organizationLocatorSchema;

export const membershipRoleSchema = z.enum(["OWNER", "ADMIN", "EDITOR", "VIEWER"]);

export const createMembershipRequestSchema = organizationLocatorSchema.extend({
  email: z.string().email(),
  role: membershipRoleSchema,
});

export const updateMembershipRequestSchema = z.object({
  role: membershipRoleSchema,
});

export const createSubscriptionRequestSchema = organizationLocatorSchema.extend({
  provider: z.string().min(1).max(64),
  providerCustomerId: z.string().min(1).max(255),
  providerSubscriptionId: z.string().min(1).max(255),
  status: z.string().min(1).max(64),
  planTier: z.enum(["FREE", "PRO", "ENTERPRISE"]),
  currentPeriodStart: z.string().datetime().optional(),
  currentPeriodEnd: z.string().datetime().optional(),
});

export const updateSubscriptionRequestSchema = z.object({
  planTier: z.enum(["FREE", "PRO", "ENTERPRISE"]).optional(),
  status: z.string().min(1).max(64).optional(),
  currentPeriodStart: z.string().datetime().optional(),
  currentPeriodEnd: z.string().datetime().optional(),
});

export const createEntitlementRequestSchema = organizationLocatorSchema.extend({
  featureKey: z.string().min(1).max(128),
  enabled: z.boolean(),
  limitValue: z.number().int().min(0).optional(),
});
export const upsertEntitlementRequestSchema = createEntitlementRequestSchema;

export const updateEntitlementRequestSchema = z.object({
  enabled: z.boolean(),
  limitValue: z.number().int().min(0).optional(),
});

export type CreateMembershipRequestDto = z.infer<typeof createMembershipRequestSchema>;
export type UpdateMembershipRequestDto = z.infer<typeof updateMembershipRequestSchema>;
export type CreateSubscriptionRequestDto = z.infer<
  typeof createSubscriptionRequestSchema
>;
export type UpdateSubscriptionRequestDto = z.infer<
  typeof updateSubscriptionRequestSchema
>;
export type CreateEntitlementRequestDto = z.infer<
  typeof createEntitlementRequestSchema
>;
export type UpdateEntitlementRequestDto = z.infer<
  typeof updateEntitlementRequestSchema
>;
