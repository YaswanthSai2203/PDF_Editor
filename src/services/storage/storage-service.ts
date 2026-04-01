export type StorageObjectKind = "source" | "derived" | "preview" | "signature";

export interface StorageDescriptor {
  bucket: string;
  key: string;
  contentType: string;
  byteSize: number;
  checksumSha256?: string;
  versionId?: string;
}

export interface UploadStorageObjectCommand {
  key: string;
  contentType: string;
  payload: ArrayBuffer;
  kind: StorageObjectKind;
}

export interface SignedStorageUrl {
  url: string;
  expiresAt: string;
}

export interface StorageService {
  uploadObject(command: UploadStorageObjectCommand): Promise<StorageDescriptor>;
  getSignedReadUrl(descriptor: StorageDescriptor): Promise<SignedStorageUrl>;
  getSignedWriteUrl(
    key: string,
    contentType: string,
  ): Promise<SignedStorageUrl>;
}
