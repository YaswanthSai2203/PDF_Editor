"use client";

import type {
  CreateFormFieldInput,
  FormFieldEntity,
  FormFieldRect,
  FormFieldType,
} from "@/features/forms/domain/form-field";

interface FormFieldApiRecord {
  id: string;
  documentId: string;
  fieldType: FormFieldType;
  name: string;
  label?: string | null;
  pageNumber: number;
  rect: FormFieldRect;
  required: boolean;
  configJson?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface FormFieldListEnvelope {
  data: FormFieldApiRecord[];
}

interface FormFieldEnvelope {
  data: FormFieldApiRecord;
}

function parseConfig(
  configJson: Record<string, unknown> | null | undefined,
): { placeholder?: string; options?: string[]; value?: string | boolean } {
  if (!configJson) {
    return {};
  }

  const placeholder =
    typeof configJson.placeholder === "string" ? configJson.placeholder : undefined;

  const optionsRaw = Array.isArray(configJson.options) ? configJson.options : undefined;
  const options = optionsRaw
    ? optionsRaw.filter((item): item is string => typeof item === "string")
    : undefined;

  const value =
    typeof configJson.value === "string" || typeof configJson.value === "boolean"
      ? configJson.value
      : undefined;

  return { placeholder, options, value };
}

function mapField(record: FormFieldApiRecord, documentKey: string): FormFieldEntity {
  const parsed = parseConfig(record.configJson);
  return {
    id: record.id,
    documentId: record.documentId,
    documentKey,
    persistedDocumentId: record.documentId,
    persisted: true,
    fieldType: record.fieldType,
    name: record.name,
    label: record.label ?? undefined,
    pageNumber: record.pageNumber,
    rect: record.rect,
    required: record.required,
    placeholder: parsed.placeholder,
    options: parsed.options,
    value: parsed.value,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function fetchFormFields(
  documentId: string,
  documentKey: string,
): Promise<FormFieldEntity[]> {
  const response = await fetch(
    `/api/form-fields?documentId=${encodeURIComponent(documentId)}`,
    { method: "GET" },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch form fields.");
  }
  const json = (await response.json()) as FormFieldListEnvelope;
  return json.data.map((field) => mapField(field, documentKey));
}

export async function createFormFieldOnServer(input: {
  documentId: string;
  documentKey: string;
  field: CreateFormFieldInput;
}): Promise<FormFieldEntity> {
  const response = await fetch("/api/form-fields", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentId: input.documentId,
      fieldType: input.field.fieldType,
      name: input.field.name,
      pageNumber: input.field.pageNumber,
      rect: input.field.rect,
      required: input.field.required,
      placeholder: input.field.placeholder,
      options: input.field.options?.map((option) => ({
        label: option,
        value: option,
      })),
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to create form field.");
  }
  const json = (await response.json()) as FormFieldEnvelope;
  return mapField(json.data, input.documentKey);
}

export async function updateFormFieldOnServer(
  fieldId: string,
  updates: {
    name?: string;
    rect?: FormFieldRect;
    required?: boolean;
    placeholder?: string;
    options?: string[];
    value?: string | boolean;
  },
): Promise<FormFieldEntity> {
  const response = await fetch(`/api/form-fields/${encodeURIComponent(fieldId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(typeof updates.name === "string" ? { name: updates.name } : {}),
      ...(updates.rect ? { rect: updates.rect } : {}),
      ...(typeof updates.required === "boolean" ? { required: updates.required } : {}),
      ...(typeof updates.placeholder === "string"
        ? { placeholder: updates.placeholder }
        : {}),
      ...(updates.options
        ? {
            options: updates.options.map((option) => ({
              label: option,
              value: option,
            })),
          }
        : {}),
      ...(typeof updates.value === "string" || typeof updates.value === "boolean"
        ? { value: updates.value }
        : {}),
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to update form field.");
  }
  const json = (await response.json()) as FormFieldEnvelope;
  return mapField(json.data, "");
}

export async function deleteFormFieldOnServer(fieldId: string): Promise<void> {
  const response = await fetch(`/api/form-fields/${encodeURIComponent(fieldId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete form field.");
  }
}

export async function submitFormValuesOnServer(
  fieldId: string,
  value: string | boolean,
): Promise<void> {
  const response = await fetch(`/api/form-fields/${encodeURIComponent(fieldId)}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      valueJson: { value },
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to submit form value.");
  }
}
