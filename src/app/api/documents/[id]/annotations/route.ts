import { z } from "zod";
import {
  requireApiAuth,
  apiError,
  ok,
  created,
  ApiError,
} from "@/server/services/api-helpers";
import { documentRepository } from "@/server/repositories/document.repository";
import { annotationRepository } from "@/server/repositories/annotation.repository";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/documents/:id/annotations
 * Return all non-deleted annotations for a document (with replies and user info).
 */
export async function GET(req: Request, ctx: RouteContext) {
  try {
    const user = await requireApiAuth();
    const { id: documentId } = await ctx.params;
    const url = new URL(req.url);
    const includeResolved = url.searchParams.get("includeResolved") === "true";

    // Verify access to document
    const doc = await documentRepository.findById(documentId, user.id);
    if (!doc) throw new ApiError(404, "Document not found.");

    const annotations = await annotationRepository.listForDocument(
      documentId,
      includeResolved
    );

    return ok(annotations);
  } catch (err) {
    return apiError(err);
  }
}

const annotationSchema = z.object({
  id: z.string().optional(),
  page: z.number().int().min(1),
  type: z.enum([
    "HIGHLIGHT",
    "UNDERLINE",
    "STRIKETHROUGH",
    "RECTANGLE",
    "ELLIPSE",
    "LINE",
    "ARROW",
    "FREEHAND",
    "TEXT",
    "COMMENT",
    "STAMP",
    "IMAGE",
    "LINK",
  ]),
  data: z.record(z.string(), z.unknown()),
});

/**
 * POST /api/documents/:id/annotations
 * Create a single new annotation.
 */
export async function POST(req: Request, ctx: RouteContext) {
  try {
    const user = await requireApiAuth();
    const { id: documentId } = await ctx.params;

    const doc = await documentRepository.findById(documentId, user.id);
    if (!doc) throw new ApiError(404, "Document not found.");

    const body = annotationSchema.parse(await req.json());

    const annotation = await annotationRepository.create({
      id: body.id,
      documentId,
      userId: user.id,
      page: body.page,
      type: body.type,
      data: body.data as Record<string, unknown>,
    });

    return created(annotation);
  } catch (err) {
    return apiError(err);
  }
}

const bulkSaveSchema = z.object({
  annotations: z.array(annotationSchema),
});

/**
 * PUT /api/documents/:id/annotations
 * Bulk upsert — saves the full annotation state from the client.
 * Used for auto-save: client sends all annotations for a document,
 * server upserts (insert new, update existing).
 */
export async function PUT(req: Request, ctx: RouteContext) {
  try {
    const user = await requireApiAuth();
    const { id: documentId } = await ctx.params;

    const doc = await documentRepository.findById(documentId, user.id);
    if (!doc) throw new ApiError(404, "Document not found.");

    const { annotations } = bulkSaveSchema.parse(await req.json());

    await annotationRepository.upsertMany(
      documentId,
      user.id,
      annotations.map((a) => ({
        id: a.id,
        documentId,
        userId: user.id,
        page: a.page,
        type: a.type,
        data: a.data as Record<string, unknown>,
      }))
    );

    return ok({ saved: annotations.length });
  } catch (err) {
    return apiError(err);
  }
}
