export type AnnotationKind = "HIGHLIGHT" | "NOTE";

export type AnnotationTool = "SELECT" | "HIGHLIGHT" | "NOTE";

export interface AnnotationRect {
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
}

export interface AnnotationEntity {
  id: string;
  documentKey: string;
  persistedDocumentId?: string;
  persisted?: boolean;
  pageNumber: number;
  kind: AnnotationKind;
  rect: AnnotationRect;
  color: string;
  noteText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnotationInput {
  documentKey: string;
  pageNumber: number;
  kind: AnnotationKind;
  rect: AnnotationRect;
}
