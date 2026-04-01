import { NextResponse } from "next/server";
import { MembershipRole } from "@prisma/client";

import { updateMembershipRequestSchema } from "@/features/admin/services/admin-api.types";
import { prisma } from "@/lib/prisma";

interface MembershipRouteContext {
  params: Promise<{
    membershipId: string;
  }>;
}

function mapMembershipRecord(
  membership: {
    id: string;
    organizationId: string;
    userId: string;
    role: MembershipRole;
    createdAt: Date;
    user: {
      id: string;
      email: string;
      name: string | null;
      avatarUrl: string | null;
    };
  },
) {
  return {
    id: membership.id,
    organizationId: membership.organizationId,
    userId: membership.userId,
    role: membership.role,
    createdAt: membership.createdAt.toISOString(),
    user: {
      id: membership.user.id,
      email: membership.user.email,
      name: membership.user.name ?? undefined,
      avatarUrl: membership.user.avatarUrl ?? undefined,
    },
  };
}

export async function PATCH(request: Request, context: MembershipRouteContext) {
  const { membershipId } = await context.params;
  const payload = await request.json();
  const parsed = updateMembershipRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid membership update payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.membership.findUnique({
    where: { id: membershipId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Membership not found." }, { status: 404 });
  }

  const updated = await prisma.membership.update({
    where: { id: membershipId },
    data: {
      role: parsed.data.role as MembershipRole,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  return NextResponse.json({
    data: mapMembershipRecord(updated),
  });
}
