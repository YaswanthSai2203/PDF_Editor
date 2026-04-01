import { z } from "zod";

export const listCommentsQuerySchema = z.object({
  documentId: z.string().min(1),
});

export const createCommentRequestSchema = z.object({
  documentId: z.string().min(1),
  body: z.string().min(1).max(2000),
  pageNumber: z.number().int().min(1).optional(),
  anchorJson: z.record(z.string(), z.unknown()).optional(),
});

export const updateCommentRequestSchema = z.object({
  body: z.string().min(1).max(2000),
});

export const listDocumentVersionsQuerySchema = z.object({
  documentId: z.string().min(1),
});

export const createDocumentVersionRequestSchema = z.object({
  documentId: z.string().min(1),
  source: z.enum(["UPLOAD", "EDIT", "IMPORT", "OCR", "SIGNATURE", "API"]),
  storageKey: z.string().min(1).max(1024),
  checksumSha256: z.string().min(8).max(128),
  pageCount: z.number().int().min(1).max(10000),
  metadataJson: z.record(z.string(), z.unknown()).optional(),
});

export const listActivityEventsQuerySchema = z.object({
  documentId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type CreateCommentRequestDto = z.infer<typeof createCommentRequestSchema>;
export type UpdateCommentRequestDto = z.infer<typeof updateCommentRequestSchema>;
export type CreateDocumentVersionRequestDto = z.infer<
  typeof createDocumentVersionRequestSchema
>;
