import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/lib/prisma", () => ({
  prisma: {
    document: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "../../../src/lib/prisma";
import { resolveOrganizationId } from "./route-utils";

describe("resolveOrganizationId", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns explicit organization id when present", async () => {
    const resolved = await resolveOrganizationId({
      organizationId: "org-direct",
      documentId: "doc-123",
    });

    expect(resolved).toBe("org-direct");
    expect(prisma.document.findUnique).not.toHaveBeenCalled();
  });

  it("looks up organization id from document id", async () => {
    vi.mocked(prisma.document.findUnique).mockResolvedValueOnce({
      organizationId: "org-from-doc",
    } as Awaited<ReturnType<typeof prisma.document.findUnique>>);

    const resolved = await resolveOrganizationId({
      documentId: "doc-123",
    });

    expect(resolved).toBe("org-from-doc");
    expect(prisma.document.findUnique).toHaveBeenCalledWith({
      where: { id: "doc-123" },
      select: { organizationId: true },
    });
  });

  it("throws when neither organization nor document id exists", async () => {
    await expect(resolveOrganizationId({})).rejects.toThrow(
      "organizationId or documentId is required.",
    );
  });
});
