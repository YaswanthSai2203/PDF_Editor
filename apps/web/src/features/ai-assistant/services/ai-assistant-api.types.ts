import { z } from "zod";

export const aiAssistantRoleSchema = z.enum(["USER", "ASSISTANT", "SYSTEM"]);

export const aiAssistantModeSchema = z.enum(["qa", "summarize", "extract", "rewrite"]);

export const aiAssistantRecentMessageSchema = z.object({
  role: aiAssistantRoleSchema,
  content: z.string().min(1).max(8000),
});

export const askAiAssistantRequestSchema = z.object({
  documentId: z.string().min(1),
  prompt: z.string().min(1).max(4000),
  pageNumber: z.number().int().min(1).optional(),
  mode: aiAssistantModeSchema.optional(),
  context: z
    .object({
      documentTitle: z.string().max(300).optional(),
      pageNumber: z.number().int().min(1).optional(),
      totalPages: z.number().int().min(1).optional(),
      selectionText: z.string().max(8000).optional(),
      mode: z.enum(["annotate", "edit"]).optional(),
      selectedTool: z.string().max(120).optional(),
      counts: z
        .object({
          editorElements: z.number().int().min(0).optional(),
          formFields: z.number().int().min(0).optional(),
          comments: z.number().int().min(0).optional(),
          versions: z.number().int().min(0).optional(),
          ocrJobs: z.number().int().min(0).optional(),
        })
        .optional(),
    })
    .optional()
    .default({}),
  recentMessages: z.array(aiAssistantRecentMessageSchema).max(20).optional(),
});

export type AskAiAssistantRequestDto = z.infer<typeof askAiAssistantRequestSchema>;
