"use client";

import type {
  AskAssistantResponsePayload,
  AiMessageEntity,
} from "@/features/ai-assistant/domain/ai-assistant";

interface AiAssistantResponseApiEnvelope {
  data: AskAssistantResponsePayload;
}

interface AiAssistantMessagesApiEnvelope {
  data: AiMessageEntity[];
}

export async function askAssistantOnServer(input: {
  documentId: string;
  documentKey: string;
  prompt: string;
  pageNumber?: number;
  context?: Record<string, unknown>;
}): Promise<AskAssistantResponsePayload> {
  const response = await fetch("/api/ai-assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentId: input.documentId,
      intent: "CUSTOM",
      prompt: input.prompt,
      pageNumber: input.pageNumber,
      context: input.context,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get AI assistant response.");
  }

  const json = (await response.json()) as AiAssistantResponseApiEnvelope;
  return json.data;
}

export async function fetchAssistantMessages(
  documentId: string,
  documentKey: string,
): Promise<AiMessageEntity[]> {
  const response = await fetch(
    `/api/ai-assistant?documentId=${encodeURIComponent(documentId)}`,
    {
      method: "GET",
    },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch AI assistant messages.");
  }
  const json = (await response.json()) as AiAssistantMessagesApiEnvelope;
  return json.data.map((message) => ({
    ...message,
    documentKey,
    persistedDocumentId: documentId,
    persisted: true,
  }));
}
