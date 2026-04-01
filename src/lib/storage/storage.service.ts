/**
 * StorageService — S3-compatible object storage abstraction.
 *
 * Supports:
 * - AWS S3
 * - Cloudflare R2 (S3-compatible, configured via CF_R2_* env vars)
 *
 * Design decisions:
 * - Presigned PUT URLs for direct client-to-storage uploads (avoids proxying
 *   large PDFs through the Next.js server, saving bandwidth + memory)
 * - Presigned GET URLs (time-limited, private by default)
 * - Key naming convention: {userId}/{documentId}/{filename}
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function createS3Client(): S3Client {
  // Prefer Cloudflare R2 if configured
  if (process.env.CF_R2_ACCOUNT_ID && process.env.CF_R2_ACCESS_KEY_ID) {
    return new S3Client({
      region: "auto",
      endpoint: `https://${process.env.CF_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CF_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  // Fall back to AWS S3
  return new S3Client({
    region: process.env.AWS_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

// Singleton client
let s3Client: S3Client | null = null;
function getClient(): S3Client {
  if (!s3Client) {
    s3Client = createS3Client();
  }
  return s3Client;
}

function getBucket(): string {
  return (
    process.env.CF_R2_BUCKET ??
    process.env.AWS_S3_BUCKET ??
    "docflow-documents"
  );
}

export interface PresignedUploadResult {
  uploadUrl: string;
  storageKey: string;
  expiresAt: Date;
}

export interface StorageObjectMeta {
  contentType: string;
  contentLength: number;
  lastModified: Date;
  etag: string;
}

export class StorageService {
  /**
   * Generate a presigned PUT URL for direct browser-to-storage upload.
   * The caller is responsible for providing a deterministic storageKey.
   */
  static async createUploadUrl(
    storageKey: string,
    contentType: string,
    expiresInSeconds = 3600
  ): Promise<PresignedUploadResult> {
    const command = new PutObjectCommand({
      Bucket: getBucket(),
      Key: storageKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(getClient(), command, {
      expiresIn: expiresInSeconds,
    });

    return {
      uploadUrl,
      storageKey,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  }

  /**
   * Generate a presigned GET URL for temporary access to a private object.
   */
  static async createDownloadUrl(
    storageKey: string,
    expiresInSeconds = 3600,
    options?: {
      contentDisposition?: string;
      responseContentType?: string;
    }
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: getBucket(),
      Key: storageKey,
      ResponseContentDisposition: options?.contentDisposition,
      ResponseContentType: options?.responseContentType,
    });

    return getSignedUrl(getClient(), command, { expiresIn: expiresInSeconds });
  }

  /**
   * Return public URL for objects in a public R2 bucket / CloudFront distribution.
   * Falls back to generating a presigned URL if no public URL base is configured.
   */
  static async getAccessUrl(
    storageKey: string,
    expiresInSeconds = 3600
  ): Promise<string> {
    const publicBase = process.env.CF_R2_PUBLIC_URL ?? process.env.S3_PUBLIC_URL;
    if (publicBase) {
      return `${publicBase.replace(/\/$/, "")}/${storageKey}`;
    }
    return this.createDownloadUrl(storageKey, expiresInSeconds);
  }

  /**
   * Delete an object from storage.
   */
  static async deleteObject(storageKey: string): Promise<void> {
    await getClient().send(
      new DeleteObjectCommand({ Bucket: getBucket(), Key: storageKey })
    );
  }

  /**
   * Copy an object within the same bucket (used for creating new versions).
   */
  static async copyObject(
    sourceKey: string,
    destKey: string
  ): Promise<void> {
    await getClient().send(
      new CopyObjectCommand({
        Bucket: getBucket(),
        CopySource: `${getBucket()}/${sourceKey}`,
        Key: destKey,
      })
    );
  }

  /**
   * Check if an object exists and return its metadata.
   */
  static async headObject(
    storageKey: string
  ): Promise<StorageObjectMeta | null> {
    try {
      const result = await getClient().send(
        new HeadObjectCommand({ Bucket: getBucket(), Key: storageKey })
      );
      return {
        contentType: result.ContentType ?? "application/octet-stream",
        contentLength: result.ContentLength ?? 0,
        lastModified: result.LastModified ?? new Date(),
        etag: result.ETag ?? "",
      };
    } catch {
      return null;
    }
  }

  /**
   * Build a consistent storage key for a document.
   * Format: documents/{ownerId}/{documentId}/original.pdf
   */
  static documentKey(ownerId: string, documentId: string): string {
    return `documents/${ownerId}/${documentId}/original.pdf`;
  }

  /**
   * Build a storage key for a document version.
   */
  static documentVersionKey(
    ownerId: string,
    documentId: string,
    version: number
  ): string {
    return `documents/${ownerId}/${documentId}/v${version}.pdf`;
  }

  /**
   * Build a storage key for a page thumbnail.
   */
  static thumbnailKey(ownerId: string, documentId: string): string {
    return `documents/${ownerId}/${documentId}/thumbnail.jpg`;
  }

  /**
   * Build a storage key for a signature image.
   */
  static signatureKey(userId: string, signatureSlotId: string): string {
    return `signatures/${userId}/${signatureSlotId}.png`;
  }
}
