"use client";

import { create } from "zustand";

import type {
  AiAssistantMessageEntity,
} from "@/features/ai-assistant/domain/ai-assistant";

interface AiAssistantStoreState {
  messagesByDocument: Record<string, AiAssistantMessageEntity[]>;
  selectedMessageIdByDocument: Record<string, string | null>;
  isBusyByDocument: Record<string, boolean>;
  setDocumentMessages: (
    documentKey: string,
    messages: AiAssistantMessageEntity[],
  ) => void;
  addLocalMessage: (
    documentKey: string,
    input: Omit<AiAssistantMessageEntity, "id" | "createdAt">,
  ) => AiAssistantMessageEntity;
  replaceMessage: (
    documentKey: string,
    previousId: string,
    next: AiAssistantMessageEntity,
  ) => void;
  selectMessage: (documentKey: string, messageId: string | null) => void;
  setBusy: (documentKey: string, isBusy: boolean) => void;
}

function nextLocalId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2)}`;
}

export const useAiAssistantStore = create<AiAssistantStoreState>((set) => ({
  messagesByDocument: {},
  selectedMessageIdByDocument: {},
  isBusyByDocument: {},

  setDocumentMessages: (documentKey, messages) => {
    set((state) => {
      const selectedId =
        state.selectedMessageIdByDocument[documentKey] ??
        messages[messages.length - 1]?.id ??
        null;
      return {
        messagesByDocument: {
          ...state.messagesByDocument,
          [documentKey]: messages,
        },
        selectedMessageIdByDocument: {
          ...state.selectedMessageIdByDocument,
          [documentKey]: selectedId,
        },
      };
    });
  },

  addLocalMessage: (documentKey, input) => {
    const created: AiAssistantMessageEntity = {
      ...input,
      id: nextLocalId("ai_message"),
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messagesByDocument: {
        ...state.messagesByDocument,
        [documentKey]: [...(state.messagesByDocument[documentKey] ?? []), created],
      },
      selectedMessageIdByDocument: {
        ...state.selectedMessageIdByDocument,
        [documentKey]: created.id,
      },
    }));

    return created;
  },

  replaceMessage: (documentKey, previousId, next) => {
    set((state) => ({
      messagesByDocument: {
        ...state.messagesByDocument,
        [documentKey]: (state.messagesByDocument[documentKey] ?? []).map((message) =>
          message.id === previousId ? next : message,
        ),
      },
      selectedMessageIdByDocument: {
        ...state.selectedMessageIdByDocument,
        [documentKey]:
          state.selectedMessageIdByDocument[documentKey] === previousId
            ? next.id
            : state.selectedMessageIdByDocument[documentKey] ?? null,
      },
    }));
  },

  selectMessage: (documentKey, messageId) => {
    set((state) => ({
      selectedMessageIdByDocument: {
        ...state.selectedMessageIdByDocument,
        [documentKey]: messageId,
      },
    }));
  },

  setBusy: (documentKey, isBusy) => {
    set((state) => ({
      isBusyByDocument: {
        ...state.isBusyByDocument,
        [documentKey]: isBusy,
      },
    }));
  },
}));
