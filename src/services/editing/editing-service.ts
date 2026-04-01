export type EditingCapability =
  | "annotations"
  | "text-editing"
  | "image-editing"
  | "page-organizer"
  | "forms"
  | "redaction";

export interface EditingOperation {
  readonly documentId: string;
  readonly actorId: string;
  readonly capability: EditingCapability;
  readonly payload: Record<string, unknown>;
}

export interface EditingResult {
  readonly revisionId: string;
  readonly appliedAt: Date;
}

export interface EditingService {
  applyOperation(operation: EditingOperation): Promise<EditingResult>;
  listCapabilities(): readonly EditingCapability[];
}
