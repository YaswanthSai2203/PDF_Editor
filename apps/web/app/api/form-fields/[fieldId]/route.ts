import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { updateFormFieldRequestSchema } from "@/features/forms/services/forms-api.types";
import { prisma } from "@/lib/prisma";

interface FormFieldRouteContext {
  params: Promise<{
    fieldId: string;
  }>;
}

function parsePatchBody(input: unknown): {
  update: {
    name?: string;
    pageNumber?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    required?: boolean;
    configJson?: unknown;
  };
  clearConfigJson: boolean;
} {
  if (!input || typeof input !== "object") {
    return { update: {}, clearConfigJson: false };
  }
  const payload = input as Record<string, unknown>;

  const update: {
    name?: string;
    pageNumber?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    required?: boolean;
    configJson?: unknown;
  } = {};

  if (typeof payload.name === "string") {
    update.name = payload.name;
  }
  if (typeof payload.pageNumber === "number") {
    update.pageNumber = payload.pageNumber;
  }
  if (typeof payload.x === "number") {
    update.x = payload.x;
  }
  if (typeof payload.y === "number") {
    update.y = payload.y;
  }
  if (typeof payload.width === "number") {
    update.width = payload.width;
  }
  if (typeof payload.height === "number") {
    update.height = payload.height;
  }
  if (typeof payload.required === "boolean") {
    update.required = payload.required;
  }
  if (
    Object.hasOwn(payload, "configJson") &&
    payload.configJson !== null &&
    payload.configJson !== undefined
  ) {
    update.configJson = payload.configJson;
  }

  return {
    update,
    clearConfigJson: payload.configJson === null,
  };
}

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
    x: field.x,
    y: field.y,
    width: field.width,
    height: field.height,
    required: field.required,
    configJson: field.configJson,
    createdAt: field.createdAt.toISOString(),
    updatedAt: field.updatedAt.toISOString(),
  };
}

export async function PATCH(request: Request, context: FormFieldRouteContext) {
  const { fieldId } = await context.params;
  const body = await request.json();
  const parsed = updateFormFieldRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid form field update payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.formField.findUnique({
    where: { id: fieldId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Form field not found." }, { status: 404 });
  }

  const { update, clearConfigJson } = parsePatchBody(body);
  const data: Prisma.FormFieldUpdateInput = {
    updatedAt: new Date(),
  };
  if (typeof update.name === "string") {
    data.name = update.name;
  }
  if (typeof update.pageNumber === "number") {
    data.pageNumber = update.pageNumber;
  }
  if (typeof update.x === "number") {
    data.x = update.x;
  }
  if (typeof update.y === "number") {
    data.y = update.y;
  }
  if (typeof update.width === "number") {
    data.width = update.width;
  }
  if (typeof update.height === "number") {
    data.height = update.height;
  }
  if (typeof update.required === "boolean") {
    data.required = update.required;
  }
  if (Object.hasOwn(update, "configJson")) {
    data.configJson = update.configJson as Prisma.InputJsonValue;
  }
  if (clearConfigJson) {
    data.configJson = Prisma.JsonNull;
  }

  const updated = await prisma.formField.update({
    where: { id: fieldId },
    data,
  });

  return NextResponse.json({
    data: mapFieldRecord(updated),
  });
}

export async function DELETE(
  _request: Request,
  context: FormFieldRouteContext,
) {
  const { fieldId } = await context.params;
  const existing = await prisma.formField.findUnique({
    where: { id: fieldId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Form field not found." }, { status: 404 });
  }

  await prisma.formField.delete({
    where: { id: fieldId },
  });

  return NextResponse.json({ success: true });
}
