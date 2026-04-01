"use client";

import { Plus, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  FormFieldEntity,
  FormFieldType,
} from "@/features/forms/domain/form-field";

interface FormsPanelProps {
  fields: FormFieldEntity[];
  selectedFieldId: string | null;
  currentPage: number;
  onSelectField: (fieldId: string | null) => void;
  onAddField: (input: { name: string; fieldType: FormFieldType; pageNumber: number }) => void;
  onDeleteField: (fieldId: string) => void;
  onUpdateFieldName: (fieldId: string, name: string) => void;
  onUpdateFieldValue: (fieldId: string, value: string) => void;
  onSubmitField: (fieldId: string) => void;
}

const formFieldTypes: FormFieldType[] = [
  "TEXT",
  "TEXTAREA",
  "CHECKBOX",
  "RADIO",
  "SELECT",
  "DATE",
  "SIGNATURE",
];

export function FormsPanel({
  fields,
  selectedFieldId,
  currentPage,
  onSelectField,
  onAddField,
  onDeleteField,
  onUpdateFieldName,
  onUpdateFieldValue,
  onSubmitField,
}: FormsPanelProps) {
  const selected = fields.find((field) => field.id === selectedFieldId) ?? null;
  const pageFields = fields.filter((field) => field.pageNumber === currentPage);

  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <div className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Forms builder
          </h3>
        </div>
        <div className="flex flex-wrap gap-1">
          {formFieldTypes.map((type) => (
            <Button
              key={type}
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[10px]"
              onClick={() =>
                onAddField({
                  name: `${type.toLowerCase()}_${Date.now().toString().slice(-6)}`,
                  fieldType: type,
                  pageNumber: currentPage,
                })
              }
            >
              <Plus className="mr-1 h-3 w-3" />
              {type}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 grid-rows-[180px_1fr]">
        <div className="space-y-2 overflow-y-auto border-b border-zinc-200 p-3 dark:border-zinc-800">
          {pageFields.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No fields on page {currentPage}.
            </p>
          ) : (
            pageFields.map((field) => (
              <button
                key={field.id}
                type="button"
                onClick={() => onSelectField(field.id)}
                className={`w-full rounded-md border px-2 py-2 text-left text-xs ${
                  field.id === selectedFieldId
                    ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
                    : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
                }`}
              >
                <div className="font-medium text-zinc-800 dark:text-zinc-100">
                  {field.name}
                </div>
                <div className="text-zinc-500 dark:text-zinc-400">{field.fieldType}</div>
              </button>
            ))
          )}
        </div>

        <div className="min-h-0 space-y-3 overflow-y-auto p-3">
          {!selected ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Select a field to edit and submit values.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs text-zinc-600 dark:text-zinc-300">Field name</label>
                <Input
                  value={selected.name}
                  onChange={(event) => onUpdateFieldName(selected.id, event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-600 dark:text-zinc-300">Value</label>
                <Input
                  value={
                    typeof selected.value === "string"
                      ? selected.value
                      : typeof selected.value === "boolean"
                        ? String(selected.value)
                        : ""
                  }
                  onChange={(event) => onUpdateFieldValue(selected.id, event.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => onSubmitField(selected.id)}
                >
                  <Save className="h-4 w-4" />
                  Save value
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => {
                    onDeleteField(selected.id);
                    onSelectField(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete field
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
