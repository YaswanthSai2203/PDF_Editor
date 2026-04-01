import { z } from "zod";

export const annotationKindSchema = z.enum(["HIGHLIGHT", "NOTE"]);

export const annotationRectSchema = z.object({
  xPct: z.number().min(0).max(100),
  yPct: z.number().min(0).max(100),
  widthPct: z.number().min(0).max(100),
  heightPct: z.number().min(0).max(100),
});

export const createAnnotationRequestSchema = z.object({
  documentId: z.string().min(1),
  pageNumber: z.number().int().min(1),
  kind: annotationKindSchema,
  rect: annotationRectSchema,
  noteText: z.string().optional(),
});

export const updateAnnotationRectRequestSchema = z.object({
  rect: annotationRectSchema,
});

export const updateAnnotationContentRequestSchema = z.object({
  rect: annotationRectSchema.optional(),
  noteText: z.string().optional(),
  syncVersion: z.number().int().min(0).optional(),
});

export type AnnotationRectDto = z.infer<typeof annotationRectSchema>;
export type CreateAnnotationRequestDto = z.infer<
  typeof createAnnotationRequestSchema
>;
export type UpdateAnnotationRectRequestDto = z.infer<
  typeof updateAnnotationRectRequestSchema
>;
export type UpdateAnnotationContentRequestDto = z.infer<
  typeof updateAnnotationContentRequestSchema
>;
