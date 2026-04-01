"use client";

import { Bot, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  AiMessageEntity,
  AiQuickAction,
} from "@/features/ai-assistant/domain/ai-assistant";

interface AiAssistantPanelProps {
  messages: AiMessageEntity[];
  isBusy: boolean;
  contextSummary: string;
  onSubmitPrompt: (prompt: string) => void;
  onQuickAction: (action: AiQuickAction) => void;
}

export function AiAssistantPanel({
  messages,
  isBusy,
  contextSummary,
  onSubmitPrompt,
  onQuickAction,
}: AiAssistantPanelProps) {
  const quickActions: AiQuickAction[] = [
    "SUMMARIZE_PAGE",
    "EXPLAIN_SELECTION",
    "SUGGEST_NEXT_STEPS",
  ];
  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto]">
      <div className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            <Bot className="h-4 w-4" />
            AI assistant
          </h3>
          <span className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {contextSummary}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {quickActions.map((action) => (
            <Button
              key={action}
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[10px]"
              onClick={() => onQuickAction(action)}
              disabled={isBusy}
            >
              {action === "SUMMARIZE_PAGE"
                ? "Summarize page"
                : action === "EXPLAIN_SELECTION"
                  ? "Explain context"
                  : "Suggest edits"}
            </Button>
          ))}
        </div>
      </div>

      <div className="min-h-0 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Ask for summaries, rewrite suggestions, or editing guidance.
          </p>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={`rounded-md border p-2 text-xs ${
                message.role === "user"
                  ? "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                  : "border-indigo-200 bg-indigo-50 dark:border-indigo-900/60 dark:bg-indigo-950/40"
              }`}
            >
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {message.role === "user" ? "You" : "Assistant"}
              </div>
              <p className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-100">
                {message.content}
              </p>
            </article>
          ))
        )}
        {isBusy ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Thinking…</p>
        ) : null}
      </div>

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const input = new FormData(form).get("prompt");
            if (typeof input !== "string" || !input.trim()) {
              return;
            }
            onSubmitPrompt(input.trim());
            form.reset();
          }}
        >
          <Input
            name="prompt"
            placeholder="Ask AI about this document..."
            disabled={isBusy}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isBusy}
            aria-label="Send AI prompt"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
