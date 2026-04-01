import { z } from "zod";

export const pageOperationKindSchema = z.enum(["REORDER", "ROTATE"]);

export const pageOperationSchema = z.object({
  type: pageOperationKindSchema,
  payloadJson: z.record(z.string(), z.unknown()),
});

export const createPageOperationRequestSchema = z.object({
  documentId: z.string().min(1),
  type: pageOperationKindSchema,
  payloadJson: z.record(z.string(), z.unknown()),
});

export const updatePageOperationRequestSchema = z.object({
  payloadJson: z.record(z.string(), z.unknown()).optional(),
  syncVersion: z.number().int().min(0).optional(),
});

export const replacePageOperationsRequestSchema = z.object({
  documentId: z.string().min(1),
  operations: z.array(pageOperationSchema).max(200),
});

export type CreatePageOperationRequestDto = z.infer<
  typeof createPageOperationRequestSchema
>;
export type UpdatePageOperationRequestDto = z.infer<
  typeof updatePageOperationRequestSchema
>;
export type ReplacePageOperationsRequestDto = z.infer<
  typeof replacePageOperationsRequestSchema
>;
