"use client";

import { create } from "zustand";

import type {
  FormFieldEntity,
} from "@/features/forms/domain/form-field";

export type FormFieldValueDraft = string | boolean;

interface FormsStoreState {
  fieldsByDocument: Record<string, FormFieldEntity[]>;
  valuesByDocument: Record<string, Record<string, FormFieldValueDraft>>;
  selectedFieldIdByDocument: Record<string, string | null>;
  setDocumentFields: (documentKey: string, fields: FormFieldEntity[]) => void;
  createLocalField: (
    documentKey: string,
    input: Omit<FormFieldEntity, "id" | "createdAt" | "updatedAt">,
  ) => FormFieldEntity;
  replaceField: (
    documentKey: string,
    previousId: string,
    next: FormFieldEntity,
  ) => void;
  deleteField: (documentKey: string, fieldId: string) => void;
  selectField: (documentKey: string, fieldId: string | null) => void;
  setFieldValue: (
    documentKey: string,
    fieldId: string,
    value: FormFieldValueDraft,
  ) => void;
  updateFieldValue: (
    documentKey: string,
    fieldId: string,
    value: FormFieldValueDraft,
  ) => void;
  clearFieldValue: (documentKey: string, fieldId: string) => void;
  getFieldValue: (
    documentKey: string,
    fieldId: string,
  ) => FormFieldValueDraft | undefined;
  getSelectedField: (documentKey: string) => FormFieldEntity | undefined;
}

function nextLocalId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2)}`;
}

export const useFormsStore = create<FormsStoreState>((set, get) => ({
  fieldsByDocument: {},
  valuesByDocument: {},
  selectedFieldIdByDocument: {},

  setDocumentFields: (documentKey, fields) => {
    set((state) => {
      const selectedId = state.selectedFieldIdByDocument[documentKey] ?? null;
      const hasSelected = selectedId
        ? fields.some((field) => field.id === selectedId)
        : false;
      return {
        fieldsByDocument: {
          ...state.fieldsByDocument,
          [documentKey]: fields,
        },
        selectedFieldIdByDocument: {
          ...state.selectedFieldIdByDocument,
          [documentKey]: hasSelected ? selectedId : fields[0]?.id ?? null,
        },
      };
    });
  },

  createLocalField: (documentKey, input) => {
    const now = new Date().toISOString();
    const created: FormFieldEntity = {
      ...input,
      id: nextLocalId("ff"),
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const existing = state.fieldsByDocument[documentKey] ?? [];
      return {
        fieldsByDocument: {
          ...state.fieldsByDocument,
          [documentKey]: [...existing, created],
        },
        selectedFieldIdByDocument: {
          ...state.selectedFieldIdByDocument,
          [documentKey]: created.id,
        },
      };
    });
    return created;
  },

  replaceField: (documentKey, previousId, next) => {
    set((state) => {
      const existing = state.fieldsByDocument[documentKey] ?? [];
      return {
        fieldsByDocument: {
          ...state.fieldsByDocument,
          [documentKey]: existing.map((field) =>
            field.id === previousId ? next : field,
          ),
        },
        selectedFieldIdByDocument: {
          ...state.selectedFieldIdByDocument,
          [documentKey]:
            state.selectedFieldIdByDocument[documentKey] === previousId
              ? next.id
              : state.selectedFieldIdByDocument[documentKey] ?? null,
        },
      };
    });
  },

  deleteField: (documentKey, fieldId) => {
    set((state) => {
      const existing = state.fieldsByDocument[documentKey] ?? [];
      const next = existing.filter((field) => field.id !== fieldId);
      return {
        fieldsByDocument: {
          ...state.fieldsByDocument,
          [documentKey]: next,
        },
        selectedFieldIdByDocument: {
          ...state.selectedFieldIdByDocument,
          [documentKey]:
            state.selectedFieldIdByDocument[documentKey] === fieldId
              ? next[0]?.id ?? null
              : state.selectedFieldIdByDocument[documentKey] ?? null,
        },
      };
    });
  },

  selectField: (documentKey, fieldId) => {
    set((state) => ({
      selectedFieldIdByDocument: {
        ...state.selectedFieldIdByDocument,
        [documentKey]: fieldId,
      },
    }));
  },

  setFieldValue: (documentKey, fieldId, value) => {
    set((state) => ({
      valuesByDocument: {
        ...state.valuesByDocument,
        [documentKey]: {
          ...(state.valuesByDocument[documentKey] ?? {}),
          [fieldId]: value,
        },
      },
    }));
  },

  updateFieldValue: (documentKey, fieldId, value) => {
    set((state) => ({
      valuesByDocument: {
        ...state.valuesByDocument,
        [documentKey]: {
          ...(state.valuesByDocument[documentKey] ?? {}),
          [fieldId]: value,
        },
      },
    }));
  },

  clearFieldValue: (documentKey, fieldId) => {
    set((state) => {
      const existing = { ...(state.valuesByDocument[documentKey] ?? {}) };
      delete existing[fieldId];
      return {
        valuesByDocument: {
          ...state.valuesByDocument,
          [documentKey]: existing,
        },
      };
    });
  },

  getFieldValue: (documentKey, fieldId) =>
    (get().valuesByDocument[documentKey] ?? {})[fieldId],
  getSelectedField: (documentKey) => {
    const state = get();
    const selectedId = state.selectedFieldIdByDocument[documentKey] ?? null;
    if (!selectedId) {
      return undefined;
    }
    return (state.fieldsByDocument[documentKey] ?? []).find(
      (field) => field.id === selectedId,
    );
  },
}));
