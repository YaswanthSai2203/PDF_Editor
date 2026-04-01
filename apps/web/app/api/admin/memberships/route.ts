import { NextResponse } from "next/server";
import { MembershipRole } from "@prisma/client";

import {
  createMembershipRequestSchema,
  listOrganizationQuerySchema,
} from "@/features/admin/services/admin-api.types";
import { resolveOrganizationId } from "../route-utils";
import { prisma } from "@/lib/prisma";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = listOrganizationQuerySchema.safeParse({
    organizationId: searchParams.get("organizationId"),
    documentId: searchParams.get("documentId"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid memberships query.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const organizationId = await resolveOrganizationId(parsed.data);
  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId or valid documentId is required." },
      { status: 400 },
    );
  }

  const memberships = await prisma.membership.findMany({
    where: {
      organizationId,
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
    orderBy: [{ createdAt: "asc" }],
  });

  return NextResponse.json({
    data: memberships.map((membership) => mapMembershipRecord(membership)),
  });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createMembershipRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid membership payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const organizationId = await resolveOrganizationId(parsed.data);
  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId or valid documentId is required." },
      { status: 400 },
    );
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  });
  if (!organization) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, name: true, avatarUrl: true },
  });

  const user =
    existingUser ??
    (await prisma.user.create({
      data: {
        email: parsed.data.email,
      },
      select: { id: true, email: true, name: true, avatarUrl: true },
    }));

  const membership = await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId,
        userId: user.id,
      },
    },
    update: {
      role: parsed.data.role as MembershipRole,
    },
    create: {
      organizationId,
      userId: user.id,
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

  return NextResponse.json(
    {
      data: mapMembershipRecord(membership),
    },
    { status: 201 },
  );
}
