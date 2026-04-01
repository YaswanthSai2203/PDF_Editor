export type PdfDocumentSource = {
  id: string;
  name: string;
  byteSize: number;
  pageCount: number;
  downloadUrl: string;
  previewImageUrl?: string;
  ownerName: string;
  lastOpenedAt: string;
};

export interface PdfDocumentService {
  getRecentDocument(): Promise<PdfDocumentSource>;
}
