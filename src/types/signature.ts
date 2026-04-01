export type SignatureRequestStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export type SlotStatus = "PENDING" | "VIEWED" | "SIGNED" | "DECLINED";
export type SignatureType = "DRAWN" | "TYPED" | "UPLOADED" | "CERTIFICATE";

export interface SignatureSlot {
  id: string;
  signatureRequestId: string;
  signerId?: string | null;
  signerEmail: string;
  signerName?: string | null;
  accessToken: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  order: number;
  status: SlotStatus;
  signatureData?: string | null;
  signatureType?: SignatureType | null;
  signedAt?: Date | null;
}

export interface SignatureRequest {
  id: string;
  documentId: string;
  requesterId: string;
  title: string;
  message?: string | null;
  status: SignatureRequestStatus;
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
  slots: SignatureSlot[];
}

export interface CreateSignatureRequestInput {
  documentId: string;
  title: string;
  message?: string;
  dueDate?: Date;
  signers: {
    email: string;
    name?: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    order?: number;
  }[];
}

export interface SignatureCanvasData {
  dataUrl: string; // base64 PNG
  type: SignatureType;
}
