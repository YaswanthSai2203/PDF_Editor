import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { requireApiAuth, apiError, ApiError } from "@/server/services/api-helpers";
import { StorageService } from "@/lib/storage/storage.service";
import { documentRepository } from "@/server/repositories/document.repository";
import { PLAN_LIMITS } from "@/types/api";

const schema = z.object({
  filename: z.string().min(1).max(500),
  contentType: z.string().default("application/pdf"),
  fileSize: z.number().positive().max(500 * 1024 * 1024), // 500MB max
  title: z.string().min(1).max(500).optional(),
  teamId: z.string().optional(),
});

/**
 * POST /api/upload
 *
 * Returns a presigned PUT URL for direct browser-to-S3 upload.
 * Creates a Document record in PROCESSING state.
 * The client uploads the file, then calls PATCH /api/documents/:id to set READY.
 *
 * This two-phase approach keeps PDF bytes off the Next.js server entirely.
 */
export async function POST(req: Request) {
  try {
    const user = await requireApiAuth();
    const body = schema.parse(await req.json());

    // Plan enforcement: check document count
    // TODO: fetch real plan from subscription table
    const planLimits = PLAN_LIMITS["FREE"];
    if (planLimits.maxDocuments !== -1) {
      const { total } = await documentRepository.list({ ownerId: user.id });
      if (total >= planLimits.maxDocuments) {
        throw new ApiError(
          403,
          `Your plan allows a maximum of ${planLimits.maxDocuments} documents. Upgrade to Pro for unlimited storage.`
        );
      }
    }

    const documentId = uuidv4();
    const storageKey = StorageService.documentKey(user.id, documentId);

    // Generate presigned upload URL (valid for 1 hour)
    const { uploadUrl, expiresAt } = await StorageService.createUploadUrl(
      storageKey,
      body.contentType,
      3600
    );

    // Create document record in PROCESSING state
    const doc = await documentRepository.create({
      title: body.title ?? body.filename.replace(/\.pdf$/i, ""),
      ownerId: user.id,
      teamId: body.teamId,
      storageKey,
      fileSize: body.fileSize,
    });

    return NextResponse.json(
      {
        data: {
          documentId: doc.id,
          uploadUrl,
          storageKey,
          expiresAt: expiresAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return apiError(err);
  }
}
