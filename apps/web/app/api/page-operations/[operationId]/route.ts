import { NextResponse } from "next/server";

import { updatePageOperationRequestSchema } from "@/features/page-organizer/services/page-organizer-api.types";

interface PageOperationRouteContext {
  params: Promise<{
    operationId: string;
  }>;
}

export async function PATCH(
  request: Request,
  context: PageOperationRouteContext,
) {
  const { operationId } = await context.params;
  const payload = await request.json();
  const parsed = updatePageOperationRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid page operation update payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Operations are stored in DocumentVersion.metadataJson.operations.
  // This route is intentionally non-mutating for now and only validates payload shape.
  return NextResponse.json({
    data: {
      id: operationId,
      payloadJson: parsed.data,
      accepted: true,
    },
  });
}

export async function DELETE(
  _request: Request,
  context: PageOperationRouteContext,
) {
  const { operationId } = await context.params;
  return NextResponse.json({
    success: true,
    id: operationId,
    accepted: true,
  });
}
