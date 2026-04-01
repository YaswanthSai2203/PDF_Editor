import { NextResponse } from "next/server";
import { FormFieldType } from "@prisma/client";

import {
  createFormFieldRequestSchema,
  listFormFieldsQuerySchema,
} from "@/features/forms/services/forms-api.types";
import { prisma } from "@/lib/prisma";

function mapFieldRecord(
  field: {
    id: string;
    documentId: string;
    fieldType:
      | "TEXT"
      | "TEXTAREA"
      | "CHECKBOX"
      | "RADIO"
      | "SELECT"
      | "DATE"
      | "SIGNATURE";
    name: string;
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    required: boolean;
    configJson: unknown;
    createdAt: Date;
    updatedAt: Date;
  },
) {
  return {
    id: field.id,
    documentId: field.documentId,
    fieldType: field.fieldType,
    name: field.name,
    pageNumber: field.pageNumber,
    rect: {
      xPct: field.x,
      yPct: field.y,
      widthPct: field.width,
      heightPct: field.height,
    },
    required: field.required,
    configJson: field.configJson,
    createdAt: field.createdAt.toISOString(),
    updatedAt: field.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = listFormFieldsQuerySchema.safeParse({
    documentId: searchParams.get("documentId"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid form fields query.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const fields = await prisma.formField.findMany({
    where: {
      documentId: parsed.data.documentId,
    },
    orderBy: [{ pageNumber: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    data: fields.map((field) => mapFieldRecord(field)),
  });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createFormFieldRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid form field payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const document = await prisma.document.findUnique({
    where: { id: parsed.data.documentId },
    select: { id: true, organizationId: true },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const created = await prisma.formField.create({
    data: {
      organizationId: document.organizationId,
      documentId: parsed.data.documentId,
      fieldType: parsed.data.fieldType as FormFieldType,
      name: parsed.data.name,
      pageNumber: parsed.data.pageNumber,
      x: parsed.data.rect.xPct,
      y: parsed.data.rect.yPct,
      width: parsed.data.rect.widthPct,
      height: parsed.data.rect.heightPct,
      required: parsed.data.required ?? false,
      configJson: {
        ...(parsed.data.options ? { options: parsed.data.options } : {}),
        ...(parsed.data.placeholder ? { placeholder: parsed.data.placeholder } : {}),
      },
    },
  });

  return NextResponse.json(
    {
      data: mapFieldRecord(created),
    },
    { status: 201 },
  );
}
