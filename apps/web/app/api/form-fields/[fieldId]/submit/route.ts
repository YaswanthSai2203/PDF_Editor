import { NextResponse } from "next/server";

import { submitFormValueSchema } from "@/features/forms/services/forms-api.types";
import { prisma } from "@/lib/prisma";

interface FormFieldSubmitRouteContext {
  params: Promise<{
    fieldId: string;
  }>;
}

export async function POST(
  request: Request,
  context: FormFieldSubmitRouteContext,
) {
  const { fieldId } = await context.params;
  const payload = await request.json();
  const parsed = submitFormValueSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid form submission payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const field = await prisma.formField.findUnique({
    where: { id: fieldId },
    select: { id: true, required: true },
  });

  if (!field) {
    return NextResponse.json({ error: "Form field not found." }, { status: 404 });
  }

  const submittedValueRaw = parsed.data.valueJson.value;
  const submittedValue =
    typeof submittedValueRaw === "string"
      ? submittedValueRaw.trim()
      : typeof submittedValueRaw === "boolean"
        ? submittedValueRaw
          ? "true"
          : "false"
        : "";

  if (field.required && submittedValue.length === 0) {
    return NextResponse.json(
      { error: "This form field is required." },
      { status: 400 },
    );
  }

  const created = await prisma.formSubmission.create({
    data: {
      formFieldId: fieldId,
      valueJson: {
        value: submittedValueRaw,
      },
      submittedById: null,
      createdAt: new Date(),
    },
  });

  return NextResponse.json(
    {
      data: {
        id: created.id,
        formFieldId: created.formFieldId,
        valueJson: created.valueJson,
        createdAt: created.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
