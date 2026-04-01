import {
  requireApiAuth,
  apiError,
  noContent,
  ApiError,
} from "@/server/services/api-helpers";
import { annotationRepository } from "@/server/repositories/annotation.repository";

interface RouteContext {
  params: Promise<{ id: string; annotationId: string; replyId: string }>;
}

/**
 * DELETE /api/documents/:id/annotations/:annotationId/replies/:replyId
 */
export async function DELETE(req: Request, ctx: RouteContext) {
  try {
    const user = await requireApiAuth();
    const { replyId } = await ctx.params;

    const deleted = await annotationRepository.deleteReply(replyId, user.id);
    if (!deleted) throw new ApiError(404, "Reply not found or unauthorized.");

    return noContent();
  } catch (err) {
    return apiError(err);
  }
}
