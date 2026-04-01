export interface PdfPageViewport {
  width: number;
  height: number;
  scale: number;
}

export type PdfDocumentSource =
  | {
      kind: "url";
      url: string;
    }
  | {
      kind: "asset";
      path: string;
    };

export interface ViewerDocument {
  id: string;
  name: string;
  source: PdfDocumentSource;
  pageCount: number;
  byteSize: number;
  ownerName: string;
  updatedAt: string;
  tags: string[];
  versionLabel: string;
  category: string;
  accessLevel: "Viewer" | "Editor" | "Admin";
  storageProvider: string;
}
