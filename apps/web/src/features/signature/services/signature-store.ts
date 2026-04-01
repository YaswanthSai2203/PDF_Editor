"use client";

import { create } from "zustand";

import type {
  SignatureRequestEntity,
  SignatureRequestStatus,
} from "@/features/signature/domain/signature-request";

interface SignatureStoreState {
  requestsByDocument: Record<string, SignatureRequestEntity[]>;
  selectedRequestIdByDocument: Record<string, string | null>;
  setDocumentRequests: (documentKey: string, requests: SignatureRequestEntity[]) => void;
  upsertRequest: (documentKey: string, request: SignatureRequestEntity) => void;
  removeRequest: (documentKey: string, requestId: string) => void;
  createLocalRequest: (
    documentKey: string,
    input: Omit<SignatureRequestEntity, "id" | "createdAt" | "updatedAt">,
  ) => SignatureRequestEntity;
  replaceRequest: (
    documentKey: string,
    previousId: string,
    next: SignatureRequestEntity,
  ) => void;
  updateRequestStatus: (
    documentKey: string,
    requestId: string,
    status: SignatureRequestStatus,
  ) => void;
  selectRequest: (documentKey: string, requestId: string | null) => void;
  getSelectedRequest: (documentKey: string) => SignatureRequestEntity | undefined;
}

function nextLocalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `sig_${crypto.randomUUID()}`;
  }
  return `sig_${Math.random().toString(36).slice(2)}`;
}

export const useSignatureStore = create<SignatureStoreState>((set, get) => ({
  requestsByDocument: {},
  selectedRequestIdByDocument: {},

  setDocumentRequests: (documentKey, requests) => {
    set((state) => {
      const selectedId = state.selectedRequestIdByDocument[documentKey] ?? null;
      const hasSelected = selectedId
        ? requests.some((request) => request.id === selectedId)
        : false;

      return {
        requestsByDocument: {
          ...state.requestsByDocument,
          [documentKey]: requests,
        },
        selectedRequestIdByDocument: {
          ...state.selectedRequestIdByDocument,
          [documentKey]: hasSelected ? selectedId : requests[0]?.id ?? null,
        },
      };
    });
  },

  upsertRequest: (documentKey, request) => {
    set((state) => {
      const existing = state.requestsByDocument[documentKey] ?? [];
      const foundIndex = existing.findIndex((item) => item.id === request.id);
      const next =
        foundIndex >= 0
          ? existing.map((item) => (item.id === request.id ? request : item))
          : [request, ...existing];

      return {
        requestsByDocument: {
          ...state.requestsByDocument,
          [documentKey]: next,
        },
      };
    });
  },

  removeRequest: (documentKey, requestId) => {
    set((state) => {
      const existing = state.requestsByDocument[documentKey] ?? [];
      const selectedId = state.selectedRequestIdByDocument[documentKey] ?? null;
      const next = existing.filter((request) => request.id !== requestId);
      return {
        requestsByDocument: {
          ...state.requestsByDocument,
          [documentKey]: next,
        },
        selectedRequestIdByDocument: {
          ...state.selectedRequestIdByDocument,
          [documentKey]:
            selectedId === requestId ? (next[0]?.id ?? null) : selectedId,
        },
      };
    });
  },

  createLocalRequest: (documentKey, input) => {
    const now = new Date().toISOString();
    const created: SignatureRequestEntity = {
      ...input,
      id: nextLocalId(),
      persisted: false,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const existing = state.requestsByDocument[documentKey] ?? [];
      return {
        requestsByDocument: {
          ...state.requestsByDocument,
          [documentKey]: [created, ...existing],
        },
        selectedRequestIdByDocument: {
          ...state.selectedRequestIdByDocument,
          [documentKey]: created.id,
        },
      };
    });

    return created;
  },

  replaceRequest: (documentKey, previousId, next) => {
    set((state) => {
      const existing = state.requestsByDocument[documentKey] ?? [];
      return {
        requestsByDocument: {
          ...state.requestsByDocument,
          [documentKey]: existing.map((request) =>
            request.id === previousId ? next : request,
          ),
        },
        selectedRequestIdByDocument: {
          ...state.selectedRequestIdByDocument,
          [documentKey]:
            state.selectedRequestIdByDocument[documentKey] === previousId
              ? next.id
              : state.selectedRequestIdByDocument[documentKey] ?? null,
        },
      };
    });
  },

  updateRequestStatus: (documentKey, requestId, status) => {
    set((state) => {
      const existing = state.requestsByDocument[documentKey] ?? [];
      return {
        requestsByDocument: {
          ...state.requestsByDocument,
          [documentKey]: existing.map((request) =>
            request.id === requestId
              ? {
                  ...request,
                  status,
                  updatedAt: new Date().toISOString(),
                }
              : request,
          ),
        },
      };
    });
  },

  selectRequest: (documentKey, requestId) => {
    set((state) => ({
      selectedRequestIdByDocument: {
        ...state.selectedRequestIdByDocument,
        [documentKey]: requestId,
      },
    }));
  },

  getSelectedRequest: (documentKey) => {
    const state = get();
    const selectedId = state.selectedRequestIdByDocument[documentKey] ?? null;
    if (!selectedId) {
      return undefined;
    }
    return (state.requestsByDocument[documentKey] ?? []).find(
      (request) => request.id === selectedId,
    );
  },
}));
