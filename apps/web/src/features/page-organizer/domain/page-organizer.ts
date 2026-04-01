export type PageOperationType = "REORDER" | "ROTATE";

export type RotateDeltaDegrees = -90 | 90 | 180;

export interface ReorderPagePayload {
  fromPage: number;
  toPage: number;
}

export interface RotatePagePayload {
  pageNumber: number;
  deltaDegrees: RotateDeltaDegrees;
}

export type PageOperationPayload = ReorderPagePayload | RotatePagePayload;

export interface PageOperation {
  id: string;
  type: PageOperationType;
  payload: PageOperationPayload;
  createdAt: string;
  updatedAt: string;
}

export interface PageOperationEntity extends PageOperation {
  documentKey: string;
  persistedDocumentId?: string;
  persisted?: boolean;
  syncVersion?: number;
}

export type PageRotationByPage = Record<number, number>;
