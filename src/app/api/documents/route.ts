import { z } from "zod";
import {
  requireApiAuth,
  apiError,
  ok,
  parsePagination,
} from "@/server/services/api-helpers";
import { documentRepository } from "@/server/repositories/document.repository";
import { StorageService } from "@/lib/storage/storage.service";

/**
 * GET /api/documents
 * List documents for the authenticated user with optional search/filter/pagination.
 */
export async function GET(req: Request) {
  try {
    const user = await requireApiAuth();
    const url = new URL(req.url);
    const { page, pageSize } = parsePagination(url);
    const search = url.searchParams.get("search") ?? undefined;
    const teamId = url.searchParams.get("teamId") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;

    const { items, total } = await documentRepository.list({
      ownerId: teamId ? undefined : user.id,
      teamId,
      search,
      status,
      page,
      pageSize,
      orderBy: "updatedAt",
      order: "desc",
    });

    // Enrich with thumbnail URLs
    const enriched = await Promise.all(
      items.map(async (doc) => ({
        ...doc,
        thumbnailUrl: doc.thumbnailKey
          ? await StorageService.getAccessUrl(doc.thumbnailKey, 3600)
          : null,
      }))
    );

    return ok({
      items: enriched,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    });
  } catch (err) {
    return apiError(err);
  }
}

const createSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  teamId: z.string().optional(),
  storageKey: z.string().min(1),
  fileSize: z.number().positive(),
});

/**
 * POST /api/documents
 * Create a document record (used when upload is already complete).
 */
export async function POST(req: Request) {
  try {
    const user = await requireApiAuth();
    const body = createSchema.parse(await req.json());

    const doc = await documentRepository.create({
      title: body.title,
      description: body.description,
      ownerId: user.id,
      teamId: body.teamId,
      storageKey: body.storageKey,
      fileSize: body.fileSize,
    });

    return ok(doc, 201);
  } catch (err) {
    return apiError(err);
  }
}
