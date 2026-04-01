export interface EditingOperation {
  operationType: "ANNOTATION" | "TEXT_EDIT" | "IMAGE_EDIT" | "PAGE_OPERATION";
  payload: Record<string, unknown>;
}

export interface ApplyEditInput {
  organizationId: string;
  documentId: string;
  baseVersionId: string;
  operations: EditingOperation[];
  actorUserId: string;
}

export interface ApplyEditOutput {
  newVersionId: string;
  versionNumber: number;
}

export interface EditingService {
  applyOperations(input: ApplyEditInput): Promise<ApplyEditOutput>;
}
