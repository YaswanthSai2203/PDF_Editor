export type Identifier = string;

export interface DocumentEntity {
  id: Identifier;
  organizationId: Identifier;
  title: string;
  currentVersionId: Identifier | null;
  createdByUserId: Identifier;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentVersionEntity {
  id: Identifier;
  documentId: Identifier;
  organizationId: Identifier;
  versionNumber: number;
  storageKey: string;
  pageCount: number;
  checksumSha256: string;
  createdAt: Date;
}
