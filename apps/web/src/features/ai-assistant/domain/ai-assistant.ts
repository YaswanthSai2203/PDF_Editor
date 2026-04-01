export type AiMessageRole = "user" | "assistant" | "system";

export type AiQuickAction =
  | "SUMMARIZE_PAGE"
  | "EXPLAIN_SELECTION"
  | "SUGGEST_NEXT_STEPS";

export interface AiMessageEntity {
  id: string;
  documentId?: string;
  documentKey?: string;
  role: AiMessageRole;
  content: string;
  pageNumber?: number;
  createdAt: string;
  persisted?: boolean;
}

export interface AskAssistantContext {
  totalPages?: number;
  currentPage?: number;
  mode?: "annotate" | "edit";
  selectedTool?: string | null;
  counts?: {
    editorElements?: number;
    formFields?: number;
    comments?: number;
    versions?: number;
    ocrJobs?: number;
  };
}

export interface AskAssistantResponsePayload {
  question: AiMessageEntity;
  answer: AiMessageEntity;
}

// Backward-compatible aliases while the feature slice settles.
export type AiAssistantMessageEntity = AiMessageEntity;
export type AiAssistantServerMessageRecord = AiMessageEntity;
export type AiAssistantResponsePayload = AskAssistantResponsePayload;

