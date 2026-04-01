export interface SignatureRecipientInput {
  email: string;
  displayName?: string;
  signingOrder: number;
}

export interface SignatureFieldInput {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  assigneeEmail: string;
  required: boolean;
}

export interface CreateSignatureRequestInput {
  organizationId: string;
  documentId: string;
  title: string;
  message?: string;
  createdByUserId: string;
  recipients: SignatureRecipientInput[];
  fields: SignatureFieldInput[];
}

export interface CreateSignatureRequestOutput {
  requestId: string;
  status: "DRAFT" | "SENT" | "COMPLETED" | "DECLINED" | "EXPIRED";
}

export interface SignatureService {
  createRequest(
    input: CreateSignatureRequestInput,
  ): Promise<CreateSignatureRequestOutput>;
  sendRequest(requestId: string, actorUserId: string): Promise<void>;
}
