import { z } from "zod";

export const editorElementKindSchema = z.enum(["TEXT", "IMAGE"]);

export const editorElementRectSchema = z.object({
  xPct: z.number().min(0).max(100),
  yPct: z.number().min(0).max(100),
  widthPct: z.number().min(0).max(100),
  heightPct: z.number().min(0).max(100),
});

export const createEditorElementRequestSchema = z.object({
  documentId: z.string().min(1),
  pageNumber: z.number().int().min(1),
  kind: editorElementKindSchema,
  rect: editorElementRectSchema,
  textContent: z.string().max(5000).optional(),
  imageSrc: z.string().url().optional(),
  textStyle: z
    .object({
      color: z.string().max(32),
      fontSizePx: z.number().min(8).max(128),
    })
    .optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export const updateEditorElementRequestSchema = z.object({
  rect: editorElementRectSchema.optional(),
  textContent: z.string().max(5000).optional(),
  imageSrc: z.string().url().optional(),
  textStyle: z
    .object({
      color: z.string().max(32),
      fontSizePx: z.number().min(8).max(128),
    })
    .optional(),
  opacity: z.number().min(0).max(1).optional(),
  syncVersion: z.number().int().min(0).optional(),
});

export type EditorElementRectDto = z.infer<typeof editorElementRectSchema>;
export type CreateEditorElementRequestDto = z.infer<
  typeof createEditorElementRequestSchema
>;
export type UpdateEditorElementRequestDto = z.infer<
  typeof updateEditorElementRequestSchema
>;
