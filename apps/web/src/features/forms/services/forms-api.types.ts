import { z } from "zod";

export const formFieldTypeSchema = z.enum([
  "TEXT",
  "TEXTAREA",
  "CHECKBOX",
  "RADIO",
  "SELECT",
  "DATE",
  "SIGNATURE",
]);

export const formFieldRectSchema = z.object({
  xPct: z.number().min(0).max(100),
  yPct: z.number().min(0).max(100),
  widthPct: z.number().min(1).max(100),
  heightPct: z.number().min(1).max(100),
});

export const formFieldOptionSchema = z.object({
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(120),
});

export const createFormFieldRequestSchema = z.object({
  documentId: z.string().min(1),
  fieldType: formFieldTypeSchema,
  name: z.string().min(1).max(120),
  pageNumber: z.number().int().min(1),
  rect: formFieldRectSchema,
  required: z.boolean().optional(),
  options: z.array(formFieldOptionSchema).max(50).optional(),
  placeholder: z.string().max(200).optional(),
  value: z.union([z.string(), z.boolean()]).optional(),
});

export const listFormFieldsQuerySchema = z.object({
  documentId: z.string().min(1),
});

export const updateFormFieldRequestSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  rect: formFieldRectSchema.optional(),
  required: z.boolean().optional(),
  options: z.array(formFieldOptionSchema).max(50).optional(),
  placeholder: z.string().max(200).optional(),
  value: z.union([z.string(), z.boolean()]).optional(),
});

export const submitFormValuesRequestSchema = z.object({
  submittedById: z.string().min(1).optional(),
  values: z.record(z.string(), z.union([z.string(), z.boolean()])),
});

export const submitFormValueSchema = z.object({
  valueJson: z.object({
    value: z.union([z.string(), z.boolean()]),
  }),
});

export type CreateFormFieldRequestDto = z.infer<typeof createFormFieldRequestSchema>;
export type UpdateFormFieldRequestDto = z.infer<typeof updateFormFieldRequestSchema>;
export type SubmitFormValuesRequestDto = z.infer<typeof submitFormValuesRequestSchema>;
