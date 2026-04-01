export type EditorElementKind = "TEXT" | "IMAGE";

export type EditorTool = "SELECT" | "TEXT" | "IMAGE";

export interface EditorElementRect {
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
}

export interface EditorTextStyle {
  fontSizePx: number;
  color: string;
}

export interface EditorElementEntity {
  id: string;
  documentKey: string;
  persistedDocumentId?: string;
  persisted?: boolean;
  syncVersion?: number;
  pageNumber: number;
  kind: EditorElementKind;
  rect: EditorElementRect;
  textContent?: string;
  textStyle?: EditorTextStyle;
  imageSrc?: string;
  opacity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEditorElementInput {
  documentKey: string;
  pageNumber: number;
  kind: EditorElementKind;
  rect: EditorElementRect;
  textContent?: string;
  textStyle?: EditorTextStyle;
  imageSrc?: string;
  opacity?: number;
}
