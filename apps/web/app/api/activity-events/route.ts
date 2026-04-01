import { NextResponse } from "next/server";

import { listActivityEventsQuerySchema } from "@/features/collaboration/services/collaboration-api.types";
import { prisma } from "@/lib/prisma";

function mapActivityRecord(
  event: {
    id: string;
    documentId: string | null;
    actorUserId: string | null;
    type: string;
    payloadJson: unknown;
    createdAt: Date;
  },
) {
  return {
    id: event.id,
    documentId: event.documentId ?? undefined,
    actorUserId: event.actorUserId ?? undefined,
    type: event.type,
    payloadJson: event.payloadJson ?? undefined,
    createdAt: event.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = listActivityEventsQuerySchema.safeParse({
    documentId: searchParams.get("documentId"),
    limit: searchParams.get("limit"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid activity events query.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const limit =
    typeof parsed.data.limit === "number" && Number.isFinite(parsed.data.limit)
      ? Math.max(1, Math.min(parsed.data.limit, 200))
      : 50;

  const events = await prisma.activityEvent.findMany({
    where: {
      documentId: parsed.data.documentId,
    },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });

  return NextResponse.json({
    data: events.map((event) => mapActivityRecord(event)),
  });
}
