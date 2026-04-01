export interface UploadPdfInput {
  organizationId: string;
  documentId: string;
  filename: string;
  contentType: "application/pdf";
}

export interface UploadPdfOutput {
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
}

export interface StorageService {
  createUploadUrl(input: UploadPdfInput): Promise<UploadPdfOutput>;
  createDownloadUrl(
    organizationId: string,
    storageKey: string,
  ): Promise<{ url: string; expiresInSeconds: number }>;
}
