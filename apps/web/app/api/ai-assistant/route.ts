import { NextResponse } from "next/server";

import {
  askAiAssistantRequestSchema,
} from "@/features/ai-assistant/services/ai-assistant-api.types";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = askAiAssistantRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid AI assistant payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const prompt = parsed.data.prompt.trim();
  const context = parsed.data.context ?? {};

  const totalPages =
    typeof context.totalPages === "number" && Number.isFinite(context.totalPages)
      ? Math.max(1, Math.floor(context.totalPages))
      : null;
  const currentPage =
    typeof context.pageNumber === "number" && Number.isFinite(context.pageNumber)
      ? Math.max(1, Math.floor(context.pageNumber))
      : parsed.data.pageNumber ?? null;
  const mode =
    typeof context.mode === "string" && context.mode.length > 0
      ? context.mode
      : "edit";
  const selectedTool =
    typeof context.selectedTool === "string" && context.selectedTool.length > 0
      ? context.selectedTool
      : "TEXT";

  const summaryLine = currentPage
    ? `Working on page ${currentPage}${totalPages ? ` of ${totalPages}` : ""} in ${mode} mode.`
    : "Working on the current page.";
  const toolLine = `Active tool context: ${selectedTool}.`;
  const explanation = `Request understood: "${prompt}"`;

  const suggestions = [
    currentPage
      ? `Review page ${currentPage} text blocks and unify font size/spacing.`
      : "Review visible page text blocks and unify font size/spacing.",
    "Run OCR if source quality is low, then copy-edit extracted text.",
    "Save a new version after applying the suggested edits.",
  ];

  const actions = [
    "Open Forms panel and validate required fields.",
    "Check signature recipients before sending requests.",
    "Run page organizer to verify page order and rotation.",
  ];

  const answer = [summaryLine, toolLine, explanation, "Next steps:", ...suggestions]
    .join("\n");

  return NextResponse.json(
    {
      data: {
        answer,
        suggestions,
        actions,
        createdAt: new Date().toISOString(),
        usage: {
          provider: "mock-local",
          promptTokens: Math.max(12, Math.ceil(prompt.length / 4)),
          completionTokens: Math.max(28, Math.ceil(answer.length / 4)),
        },
      },
    },
    { status: 200 },
  );
}
