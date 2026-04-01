export type AnnotationType =
  | "HIGHLIGHT"
  | "UNDERLINE"
  | "STRIKETHROUGH"
  | "RECTANGLE"
  | "ELLIPSE"
  | "LINE"
  | "ARROW"
  | "FREEHAND"
  | "TEXT"
  | "COMMENT"
  | "STAMP"
  | "IMAGE"
  | "LINK";

export type AnnotationTool =
  | "SELECT"
  | "PAN"
  | "HIGHLIGHT"
  | "UNDERLINE"
  | "STRIKETHROUGH"
  | "RECTANGLE"
  | "ELLIPSE"
  | "LINE"
  | "ARROW"
  | "FREEHAND"
  | "TEXT"
  | "COMMENT"
  | "STAMP"
  | "IMAGE"
  | "ERASER"
  | "SIGNATURE";

export interface AnnotationRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotationPoint {
  x: number;
  y: number;
}

// Base data shared by all annotations
interface BaseAnnotationData {
  color?: string;
  opacity?: number;
}

export interface HighlightAnnotationData extends BaseAnnotationData {
  rects: AnnotationRect[]; // can span multiple lines
  selectedText?: string;
}

export interface ShapeAnnotationData extends BaseAnnotationData {
  rect: AnnotationRect;
  strokeWidth?: number;
  fillColor?: string;
}

export interface FreehandAnnotationData extends BaseAnnotationData {
  points: AnnotationPoint[];
  strokeWidth?: number;
}

export interface TextAnnotationData extends BaseAnnotationData {
  rect: AnnotationRect;
  content: string;
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
}

export interface CommentAnnotationData extends BaseAnnotationData {
  rect: AnnotationRect;
  content: string;
}

export interface StampAnnotationData extends BaseAnnotationData {
  rect: AnnotationRect;
  stampType: "APPROVED" | "REJECTED" | "DRAFT" | "CONFIDENTIAL" | "CUSTOM";
  customText?: string;
}

export interface ImageAnnotationData extends BaseAnnotationData {
  rect: AnnotationRect;
  storageKey: string;
  dataUrl?: string; // ephemeral preview
}

export interface LinkAnnotationData extends BaseAnnotationData {
  rect: AnnotationRect;
  url: string;
}

export type AnnotationData =
  | HighlightAnnotationData
  | ShapeAnnotationData
  | FreehandAnnotationData
  | TextAnnotationData
  | CommentAnnotationData
  | StampAnnotationData
  | ImageAnnotationData
  | LinkAnnotationData;

export interface Annotation {
  id: string;
  documentId: string;
  userId: string;
  page: number;
  type: AnnotationType;
  data: AnnotationData;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  // Populated joins
  user?: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
  replies?: AnnotationReply[];
}

export interface AnnotationReply {
  id: string;
  annotationId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
}

export interface AnnotationToolSettings {
  color: string;
  opacity: number;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
}
