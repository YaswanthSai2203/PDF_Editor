import { z } from "zod";
import {
  requireApiAuth,
  apiError,
  ok,
  noContent,
  ApiError,
} from "@/server/services/api-helpers";
import { annotationRepository } from "@/server/repositories/annotation.repository";

interface RouteContext {
  params: Promise<{ id: string; annotationId: string }>;
}

const patchSchema = z.object({
  data: z.record(z.string(), z.unknown()).optional(),
  isResolved: z.boolean().optional(),
});

/**
 * PATCH /api/documents/:id/annotations/:annotationId
 * Update annotation data or resolve it.
 */
export async function PATCH(req: Request, ctx: RouteContext) {
  try {
    const user = await requireApiAuth();
    const { annotationId } = await ctx.params;
    const body = patchSchema.parse(await req.json());

    const updated = await annotationRepository.update(
      annotationId,
      user.id,
      body as { data?: Record<string, unknown>; isResolved?: boolean }
    );

    if (!updated) throw new ApiError(404, "Annotation not found.");

    return ok(updated);
  } catch (err) {
    return apiError(err);
  }
}

/**
 * DELETE /api/documents/:id/annotations/:annotationId
 * Soft-delete an annotation.
 */
export async function DELETE(req: Request, ctx: RouteContext) {
  try {
    const user = await requireApiAuth();
    const { annotationId } = await ctx.params;

    const deleted = await annotationRepository.softDelete(annotationId, user.id);
    if (!deleted) throw new ApiError(404, "Annotation not found or unauthorized.");

    return noContent();
  } catch (err) {
    return apiError(err);
  }
}
