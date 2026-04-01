export type FormFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "CHECKBOX"
  | "RADIO"
  | "SELECT"
  | "DATE"
  | "SIGNATURE";

export interface FormFieldRect {
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
}

export interface FormFieldEntity {
  id: string;
  documentId: string;
  documentKey?: string;
  persistedDocumentId?: string;
  persisted?: boolean;
  fieldType: FormFieldType;
  name: string;
  label?: string;
  pageNumber: number;
  rect: FormFieldRect;
  required: boolean;
  placeholder?: string;
  options?: string[];
  value?: string | boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFormFieldInput {
  documentId: string;
  pageNumber: number;
  fieldType: FormFieldType;
  name: string;
  label?: string;
  rect: FormFieldRect;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}
