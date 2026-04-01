import { z } from "zod";

export const listOcrJobsQuerySchema = z.object({
  documentId: z.string().min(1),
});

export const createOcrJobRequestSchema = z.object({
  documentId: z.string().min(1),
  provider: z.string().min(1).max(64).default("mock-ocr"),
  pageCountHint: z.number().int().min(1).max(500).optional(),
});

export const updateOcrJobStatusRequestSchema = z.object({
  status: z.enum(["QUEUED", "RUNNING", "COMPLETED", "FAILED"]).optional(),
  errorMessage: z.string().max(2000).optional(),
});

export type CreateOcrJobRequestDto = z.infer<typeof createOcrJobRequestSchema>;
export type UpdateOcrJobStatusRequestDto = z.infer<
  typeof updateOcrJobStatusRequestSchema
>;
