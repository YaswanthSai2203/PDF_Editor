import { z } from "zod";

export const signatureRecipientInputSchema = z.object({
  email: z.email(),
  displayName: z.string().max(120).optional(),
  signingOrder: z.number().int().min(1),
});

export const createSignatureRequestSchema = z.object({
  documentId: z.string().min(1),
  title: z.string().min(1).max(200),
  message: z.string().max(5000).optional(),
  expiresAt: z.iso.datetime().optional(),
  recipients: z.array(signatureRecipientInputSchema).min(1).max(50),
});

export const listSignatureRequestsQuerySchema = z.object({
  documentId: z.string().min(1),
});

export const updateSignatureRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  message: z.string().max(5000).optional(),
  expiresAt: z.iso.datetime().optional(),
  recipients: z.array(signatureRecipientInputSchema).min(1).max(50).optional(),
});

export const sendSignatureRequestSchema = z.object({
  sendNow: z.boolean().default(true),
});

export type CreateSignatureRequestDto = z.infer<typeof createSignatureRequestSchema>;
export type UpdateSignatureRequestDto = z.infer<typeof updateSignatureRequestSchema>;
export type SendSignatureRequestDto = z.infer<typeof sendSignatureRequestSchema>;
