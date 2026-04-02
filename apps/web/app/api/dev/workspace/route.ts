import { createHash } from "node:crypto";

import { DocumentVersionSource, MembershipRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const DEV_ORG_SLUG = "nimbuspdf-local";
const DEV_USER_EMAIL = "local@nimbuspdf.dev";

const createWorkspaceBodySchema = z.object({
  title: z.string().min(1).max(300).optional(),
  sourceUrl: z.string().min(1).max(32_000),
  pageCount: z.number().int().min(1).max(10_000),
});

function isBootstrapAllowed(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_DEV_WORKSPACE_BOOTSTRAP === "true"
  );
}

function checksumForVersion(sourceUrl: string, pageCount: number): string {
  return createHash("sha256")
    .update(`${sourceUrl}\n${pageCount}`)
    .digest("hex");
}

export async function POST(request: Request) {
  if (!isBootstrapAllowed()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createWorkspaceBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const title =
    parsed.data.title?.trim() ||
    (() => {
      try {
        return new URL(parsed.data.sourceUrl).hostname || "PDF document";
      } catch {
        return "PDF document";
      }
    })();

  const pageCount = parsed.data.pageCount;
  const storageKey = `remote:${parsed.data.sourceUrl.slice(0, 2000)}`;
  const checksumSha256 = checksumForVersion(parsed.data.sourceUrl, pageCount);

  const result = await prisma.$transaction(async (tx) => {
    let organization = await tx.organization.findUnique({
      where: { slug: DEV_ORG_SLUG },
    });
    if (!organization) {
      organization = await tx.organization.create({
        data: {
          name: "Local workspace",
          slug: DEV_ORG_SLUG,
        },
      });
    }

    let user = await tx.user.findUnique({
      where: { email: DEV_USER_EMAIL },
    });
    if (!user) {
      user = await tx.user.create({
        data: { email: DEV_USER_EMAIL, name: "Local user" },
      });
    }

    await tx.membership.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: user.id,
        },
      },
      update: { role: MembershipRole.OWNER },
      create: {
        organizationId: organization.id,
        userId: user.id,
        role: MembershipRole.OWNER,
      },
    });

    const document = await tx.document.create({
      data: {
        organizationId: organization.id,
        createdByUserId: user.id,
        title,
        status: "ACTIVE",
      },
    });

    const version = await tx.documentVersion.create({
      data: {
        documentId: document.id,
        organizationId: organization.id,
        versionNumber: 1,
        source: DocumentVersionSource.IMPORT,
        storageKey,
        checksumSha256,
        pageCount,
        metadataJson: {
          sourceUrl: parsed.data.sourceUrl,
          bootstrap: "dev-workspace",
        },
        createdByUserId: user.id,
      },
    });

    await tx.document.update({
      where: { id: document.id },
      data: { currentVersionId: version.id },
    });

    return {
      documentId: document.id,
      organizationId: organization.id,
      documentVersionId: version.id,
    };
  });

  return NextResponse.json({ data: result }, { status: 201 });
}
