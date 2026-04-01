import { z } from "zod";
import {
  requireApiAuth,
  apiError,
  ok,
  noContent,
  ApiError,
} from "@/server/services/api-helpers";
import { documentRepository } from "@/server/repositories/document.repository";
import { StorageService } from "@/lib/storage/storage.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/documents/:id
 * Fetch a single document with a time-limited access URL for the PDF.
 */
export async function GET(req: Request, ctx: RouteContext) {
  try {
    const user = await requireApiAuth();
    const { id } = await ctx.params;

    const doc = await documentRepository.findById(id, user.id);
    if (!doc) throw new ApiError(404, "Document not found.");

    const [pdfUrl, thumbnailUrl] = await Promise.all([
      StorageService.createDownloadUrl(doc.storageKey, 3600, {
        responseContentType: "application/pdf",
        contentDisposition: `inline; filename="${encodeURIComponent(doc.title)}"`,
      }),
      doc.thumbnailKey
        ? StorageService.getAccessUrl(doc.thumbnailKey, 3600)
        : null,
    ]);

    return ok({ ...doc, pdfUrl, thumbnailUrl });
  } catch (err) {
    return apiError(err);
  }
}

const patchSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  pageCount: z.number().int().positive().optional(),
  status: z.enum(["PROCESSING", "READY", "ERROR"]).optional(),
  thumbnailKey: z.string().optional(),
  ocrStatus: z.enum(["NONE", "PENDING", "PROCESSING", "DONE", "ERROR"]).optional(),
  isShared: z.boolean().optional(),
});

/**
 * PATCH /api/documents/:id
 * Update document metadata (title, status after upload complete, etc.)
 */
export async function PATCH(req: Request, ctx: RouteContext) {
  try {
    const user = await requireApiAuth();
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());

    const updated = await documentRepository.update(id, user.id, body);
    if (!updated) throw new ApiError(404, "Document not found.");

    return ok(updated);
  } catch (err) {
    return apiError(err);
  }
}

/**
 * DELETE /api/documents/:id
 * Soft-delete a document.
 */
export async function DELETE(req: Request, ctx: RouteContext) {
  try {
    const user = await requireApiAuth();
    const { id } = await ctx.params;

    const deleted = await documentRepository.softDelete(id, user.id);
    if (!deleted) throw new ApiError(404, "Document not found or unauthorized.");

    return noContent();
  } catch (err) {
    return apiError(err);
  }
}
