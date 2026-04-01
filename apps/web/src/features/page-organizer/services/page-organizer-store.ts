"use client";

import { create } from "zustand";

import type {
  PageOperationEntity,
  PageOperationType,
  PageOperationPayload,
} from "@/features/page-organizer/domain/page-organizer";

interface PageOrganizerStoreState {
  operationsByDocument: Record<string, PageOperationEntity[]>;
  historyByDocument: Record<string, PageOperationEntity[][]>;
  futureByDocument: Record<string, PageOperationEntity[][]>;
  setDocumentOperations: (
    documentKey: string,
    operations: PageOperationEntity[],
  ) => void;
  createOperation: (input: {
    documentKey: string;
    type: PageOperationType;
    payload: PageOperationPayload;
  }) => PageOperationEntity;
  replaceOperation: (
    documentKey: string,
    previousId: string,
    next: PageOperationEntity,
  ) => void;
  deleteOperation: (documentKey: string, operationId: string) => void;
  canUndo: (documentKey: string) => boolean;
  canRedo: (documentKey: string) => boolean;
  undo: (documentKey: string) => void;
  redo: (documentKey: string) => void;
  getOperations: (documentKey: string) => PageOperationEntity[];
  getOperationById: (
    documentKey: string,
    operationId: string,
  ) => PageOperationEntity | undefined;
}

function nextId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `pgo_${crypto.randomUUID()}`;
  }
  return `pgo_${Math.random().toString(36).slice(2)}`;
}

function cloneOperation(operation: PageOperationEntity): PageOperationEntity {
  return {
    ...operation,
    payload: { ...operation.payload },
  };
}

function snapshot(items: PageOperationEntity[]): PageOperationEntity[] {
  return items.map(cloneOperation);
}

function withHistoryUpdate(
  state: PageOrganizerStoreState,
  documentKey: string,
  nextOperations: PageOperationEntity[],
): Pick<
  PageOrganizerStoreState,
  "operationsByDocument" | "historyByDocument" | "futureByDocument"
> {
  const previous = state.operationsByDocument[documentKey] ?? [];
  return {
    operationsByDocument: {
      ...state.operationsByDocument,
      [documentKey]: nextOperations,
    },
    historyByDocument: {
      ...state.historyByDocument,
      [documentKey]: [
        ...(state.historyByDocument[documentKey] ?? []),
        snapshot(previous),
      ],
    },
    futureByDocument: {
      ...state.futureByDocument,
      [documentKey]: [],
    },
  };
}

export const usePageOrganizerStore = create<PageOrganizerStoreState>((set, get) => ({
  operationsByDocument: {},
  historyByDocument: {},
  futureByDocument: {},

  setDocumentOperations: (documentKey, operations) => {
    set((state) => ({
      operationsByDocument: {
        ...state.operationsByDocument,
        [documentKey]: operations,
      },
      historyByDocument: {
        ...state.historyByDocument,
        [documentKey]: [],
      },
      futureByDocument: {
        ...state.futureByDocument,
        [documentKey]: [],
      },
    }));
  },

  createOperation: (input) => {
    const now = new Date().toISOString();
    const created: PageOperationEntity = {
      id: nextId(),
      documentKey: input.documentKey,
      persisted: false,
      syncVersion: 0,
      type: input.type,
      payload: input.payload,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const existing = state.operationsByDocument[input.documentKey] ?? [];
      return withHistoryUpdate(state, input.documentKey, [...existing, created]);
    });

    return created;
  },

  deleteOperation: (documentKey, operationId) => {
    set((state) => {
      const existing = state.operationsByDocument[documentKey] ?? [];
      return withHistoryUpdate(
        state,
        documentKey,
        existing.filter((item) => item.id !== operationId),
      );
    });
  },

  replaceOperation: (documentKey, previousId, next) => {
    set((state) => {
      const existing = state.operationsByDocument[documentKey] ?? [];
      return {
        operationsByDocument: {
          ...state.operationsByDocument,
          [documentKey]: existing.map((item) => (item.id === previousId ? next : item)),
        },
      };
    });
  },

  canUndo: (documentKey) => (get().historyByDocument[documentKey] ?? []).length > 0,
  canRedo: (documentKey) => (get().futureByDocument[documentKey] ?? []).length > 0,

  undo: (documentKey) => {
    set((state) => {
      const history = state.historyByDocument[documentKey] ?? [];
      if (history.length === 0) {
        return {};
      }
      const current = state.operationsByDocument[documentKey] ?? [];
      const previous = history[history.length - 1];
      return {
        operationsByDocument: {
          ...state.operationsByDocument,
          [documentKey]: snapshot(previous),
        },
        historyByDocument: {
          ...state.historyByDocument,
          [documentKey]: history.slice(0, -1),
        },
        futureByDocument: {
          ...state.futureByDocument,
          [documentKey]: [...(state.futureByDocument[documentKey] ?? []), snapshot(current)],
        },
      };
    });
  },

  redo: (documentKey) => {
    set((state) => {
      const future = state.futureByDocument[documentKey] ?? [];
      if (future.length === 0) {
        return {};
      }
      const current = state.operationsByDocument[documentKey] ?? [];
      const next = future[future.length - 1];
      return {
        operationsByDocument: {
          ...state.operationsByDocument,
          [documentKey]: snapshot(next),
        },
        futureByDocument: {
          ...state.futureByDocument,
          [documentKey]: future.slice(0, -1),
        },
        historyByDocument: {
          ...state.historyByDocument,
          [documentKey]: [...(state.historyByDocument[documentKey] ?? []), snapshot(current)],
        },
      };
    });
  },

  getOperations: (documentKey) => get().operationsByDocument[documentKey] ?? [],
  getOperationById: (documentKey, operationId) =>
    (get().operationsByDocument[documentKey] ?? []).find(
      (operation) => operation.id === operationId,
    ),
}));
