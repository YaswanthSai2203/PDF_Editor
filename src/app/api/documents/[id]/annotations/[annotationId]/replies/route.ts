import { z } from "zod";
import {
  requireApiAuth,
  apiError,
  created,
  noContent,
  ApiError,
} from "@/server/services/api-helpers";
import { annotationRepository } from "@/server/repositories/annotation.repository";

interface RouteContext {
  params: Promise<{ id: string; annotationId: string }>;
}

const replySchema = z.object({
  content: z.string().min(1).max(5000),
});

/**
 * POST /api/documents/:id/annotations/:annotationId/replies
 */
export async function POST(req: Request, ctx: RouteContext) {
  try {
    const user = await requireApiAuth();
    const { annotationId } = await ctx.params;
    const { content } = replySchema.parse(await req.json());

    // Verify annotation exists
    const annotation = await annotationRepository.findById(annotationId);
    if (!annotation) throw new ApiError(404, "Annotation not found.");

    const reply = await annotationRepository.addReply(
      annotationId,
      user.id,
      content
    );

    return created(reply);
  } catch (err) {
    return apiError(err);
  }
}
