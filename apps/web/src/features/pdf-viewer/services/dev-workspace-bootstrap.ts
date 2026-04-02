"use client";

export async function ensureDevWorkspaceDocument(input: {
  sourceUrl: string;
  pageCount: number;
  title?: string;
}): Promise<string> {
  const sourceUrl =
    input.sourceUrl.length > 31_000
      ? `${input.sourceUrl.slice(0, 31_000)}…`
      : input.sourceUrl;
  const response = await fetch("/api/dev/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceUrl,
      pageCount: input.pageCount,
      title: input.title,
    }),
  });

  if (!response.ok) {
    let message = "Workspace bootstrap failed.";
    try {
      const json = (await response.json()) as { error?: string };
      if (typeof json.error === "string") {
        message = json.error;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const json = (await response.json()) as { data: { documentId: string } };
  return json.data.documentId;
}
