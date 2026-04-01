export type SignatureProvider = "native" | "docusign" | "adobe-sign";

export interface SignatureFieldPlacement {
  readonly pageNumber: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly required: boolean;
  readonly role: "signer" | "approver" | "viewer";
}

export interface SignatureRequestInput {
  readonly documentId: string;
  readonly provider: SignatureProvider;
  readonly recipients: ReadonlyArray<{
    readonly email: string;
    readonly name: string;
    readonly role: "signer" | "approver" | "viewer";
  }>;
  readonly fields: ReadonlyArray<SignatureFieldPlacement>;
}

export interface SignatureRequestResult {
  readonly id: string;
  readonly providerRequestId: string;
  readonly signingUrl?: string;
  readonly status: "draft" | "sent" | "signed" | "declined" | "expired";
}

export interface SignatureService {
  createRequest(input: SignatureRequestInput): Promise<SignatureRequestResult>;
  getSigningUrl(requestId: string): Promise<string>;
}
