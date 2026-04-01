export type SignatureRequestStatus =
  | "DRAFT"
  | "SENT"
  | "COMPLETED"
  | "DECLINED"
  | "EXPIRED";

export type SignatureRecipientStatus =
  | "PENDING"
  | "OPENED"
  | "SIGNED"
  | "DECLINED";

export interface SignatureRecipientEntity {
  id: string;
  signatureRequestId: string;
  email: string;
  displayName?: string;
  signingOrder: number;
  status: SignatureRecipientStatus;
  openedAt?: string;
  signedAt?: string;
  declinedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SignatureRequestEntity {
  id: string;
  documentId: string;
  documentKey?: string;
  persistedDocumentId?: string;
  persisted?: boolean;
  title: string;
  status: SignatureRequestStatus;
  message?: string;
  expiresAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  recipients: SignatureRecipientEntity[];
}

export interface SignatureRecipientInput {
  email: string;
  displayName?: string;
  signingOrder: number;
}

export interface CreateSignatureRequestInput {
  documentId: string;
  title: string;
  message?: string;
  expiresAt?: string;
  recipients: SignatureRecipientInput[];
}
