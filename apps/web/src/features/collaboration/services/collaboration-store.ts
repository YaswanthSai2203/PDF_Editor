"use client";

import { create } from "zustand";

import type {
  CollaborationCommentEntity,
  ActivityEventEntity,
  DocumentVersionEntity,
} from "@/features/collaboration/domain/collaboration";

interface CollaborationStoreState {
  commentsByDocument: Record<string, CollaborationCommentEntity[]>;
  versionsByDocument: Record<string, DocumentVersionEntity[]>;
  activitiesByDocument: Record<string, ActivityEventEntity[]>;
  activeCommentIdByDocument: Record<string, string | null>;
  setDocumentComments: (
    documentKey: string,
    comments: CollaborationCommentEntity[],
  ) => void;
  createLocalComment: (
    documentKey: string,
    input: Omit<
      CollaborationCommentEntity,
      "id" | "createdAt" | "updatedAt" | "persisted"
    >,
  ) => CollaborationCommentEntity;
  replaceComment: (
    documentKey: string,
    previousId: string,
    next: CollaborationCommentEntity,
  ) => void;
  deleteComment: (documentKey: string, commentId: string) => void;
  setActiveCommentId: (documentKey: string, commentId: string | null) => void;
  setDocumentVersions: (documentKey: string, versions: DocumentVersionEntity[]) => void;
  createLocalVersion: (
    documentKey: string,
    input: Omit<
      DocumentVersionEntity,
      "id" | "versionNumber" | "createdAt" | "persisted"
    > & {
      versionNumber?: number;
    },
  ) => DocumentVersionEntity;
  replaceVersion: (
    documentKey: string,
    previousId: string,
    next: DocumentVersionEntity,
  ) => void;
  setDocumentActivities: (
    documentKey: string,
    activities: ActivityEventEntity[],
  ) => void;
}

function nextLocalId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2)}`;
}

export const useCollaborationStore = create<CollaborationStoreState>((set, get) => ({
  commentsByDocument: {},
  versionsByDocument: {},
  activitiesByDocument: {},
  activeCommentIdByDocument: {},

  setDocumentComments: (documentKey, comments) => {
    set((state) => {
      const selectedId = state.activeCommentIdByDocument[documentKey] ?? null;
      const hasSelected = selectedId
        ? comments.some((comment) => comment.id === selectedId)
        : false;
      return {
        commentsByDocument: {
          ...state.commentsByDocument,
          [documentKey]: comments,
        },
        activeCommentIdByDocument: {
          ...state.activeCommentIdByDocument,
          [documentKey]: hasSelected ? selectedId : comments[0]?.id ?? null,
        },
      };
    });
  },

  createLocalComment: (documentKey, input) => {
    const now = new Date().toISOString();
    const created: CollaborationCommentEntity = {
      ...input,
      id: nextLocalId("comment"),
      persisted: false,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const existing = state.commentsByDocument[documentKey] ?? [];
      return {
        commentsByDocument: {
          ...state.commentsByDocument,
          [documentKey]: [created, ...existing],
        },
        activeCommentIdByDocument: {
          ...state.activeCommentIdByDocument,
          [documentKey]: created.id,
        },
      };
    });

    return created;
  },

  replaceComment: (documentKey, previousId, next) => {
    set((state) => {
      const existing = state.commentsByDocument[documentKey] ?? [];
      return {
        commentsByDocument: {
          ...state.commentsByDocument,
          [documentKey]: existing.map((comment) =>
            comment.id === previousId ? next : comment,
          ),
        },
        activeCommentIdByDocument: {
          ...state.activeCommentIdByDocument,
          [documentKey]:
            state.activeCommentIdByDocument[documentKey] === previousId
              ? next.id
              : state.activeCommentIdByDocument[documentKey] ?? null,
        },
      };
    });
  },

  deleteComment: (documentKey, commentId) => {
    set((state) => {
      const existing = state.commentsByDocument[documentKey] ?? [];
      const next = existing.filter((comment) => comment.id !== commentId);
      return {
        commentsByDocument: {
          ...state.commentsByDocument,
          [documentKey]: next,
        },
        activeCommentIdByDocument: {
          ...state.activeCommentIdByDocument,
          [documentKey]:
            state.activeCommentIdByDocument[documentKey] === commentId
              ? (next[0]?.id ?? null)
              : state.activeCommentIdByDocument[documentKey] ?? null,
        },
      };
    });
  },

  setActiveCommentId: (documentKey, commentId) => {
    set((state) => ({
      activeCommentIdByDocument: {
        ...state.activeCommentIdByDocument,
        [documentKey]: commentId,
      },
    }));
  },

  setDocumentVersions: (documentKey, versions) => {
    set((state) => ({
      versionsByDocument: {
        ...state.versionsByDocument,
        [documentKey]: versions,
      },
    }));
  },

  createLocalVersion: (documentKey, input) => {
    const now = new Date().toISOString();
    const current = get().versionsByDocument[documentKey] ?? [];
    const fallbackVersion = current.length + 1;
    const created: DocumentVersionEntity = {
      ...input,
      id: nextLocalId("version"),
      versionNumber: input.versionNumber ?? fallbackVersion,
      persisted: false,
      createdAt: now,
    };

    set((state) => {
      const existing = state.versionsByDocument[documentKey] ?? [];
      return {
        versionsByDocument: {
          ...state.versionsByDocument,
          [documentKey]: [created, ...existing],
        },
      };
    });

    return created;
  },

  replaceVersion: (documentKey, previousId, next) => {
    set((state) => ({
      versionsByDocument: {
        ...state.versionsByDocument,
        [documentKey]: (state.versionsByDocument[documentKey] ?? []).map((version) =>
          version.id === previousId ? next : version,
        ),
      },
    }));
  },

  setDocumentActivities: (documentKey, activities) => {
    set((state) => ({
      activitiesByDocument: {
        ...state.activitiesByDocument,
        [documentKey]: activities,
      },
    }));
  },
}));
