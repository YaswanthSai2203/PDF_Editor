"use client";

import { useState, useRef, useTransition } from "react";
import { Send, Trash2, CheckCircle2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Annotation, AnnotationReply } from "@/types/annotation";

interface CommentThreadProps {
  annotation: Annotation;
  currentUserId: string;
  onResolve?: (annotationId: string) => void;
  onDelete?: (annotationId: string) => void;
  documentId: string;
}

const TYPE_COLORS: Record<string, string> = {
  COMMENT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  HIGHLIGHT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  TEXT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export function CommentThread({
  annotation,
  currentUserId,
  onResolve,
  onDelete,
  documentId,
}: CommentThreadProps) {
  const [replies, setReplies] = useState<AnnotationReply[]>(
    annotation.replies ?? []
  );
  const [replyText, setReplyText] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isOwner = annotation.userId === currentUserId;
  const authorName = annotation.user?.name ?? "User";
  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleReply() {
    const content = replyText.trim();
    if (!content) return;

    startTransition(async () => {
      const res = await fetch(
        `/api/documents/${documentId}/annotations/${annotation.id}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (res.ok) {
        const { data } = await res.json();
        setReplies((prev) => [...prev, data]);
        setReplyText("");
      }
    });
  }

  function handleDeleteReply(replyId: string) {
    startTransition(async () => {
      const res = await fetch(
        `/api/documents/${documentId}/annotations/${annotation.id}/replies/${replyId}`,
        { method: "DELETE" }
      );
      if (res.ok || res.status === 204) {
        setReplies((prev) => prev.filter((r) => r.id !== replyId));
      }
    });
  }

  const previewText = (() => {
    const d = annotation.data as unknown as Record<string, unknown>;
    if (typeof d.content === "string") return d.content;
    if (typeof d.selectedText === "string") return d.selectedText;
    return null;
  })();

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-3 space-y-3 text-sm",
        annotation.isResolved && "opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src={annotation.user?.image ?? undefined} />
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-xs">{authorName}</span>
            <Badge
              className={cn(
                "text-[10px] h-4 px-1 border-none",
                TYPE_COLORS[annotation.type] ?? "bg-gray-100 text-gray-700"
              )}
            >
              {annotation.type.toLowerCase()}
            </Badge>
            <span className="text-[10px] text-muted-foreground ml-auto">
              p.{annotation.page} · {formatRelativeTime(annotation.createdAt)}
            </span>
          </div>

          {previewText && (
            <p className="mt-1 text-xs text-muted-foreground italic line-clamp-2">
              &ldquo;{previewText}&rdquo;
            </p>
          )}
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {!annotation.isResolved && (
              <DropdownMenuItem
                onClick={() => onResolve?.(annotation.id)}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Resolve
              </DropdownMenuItem>
            )}
            {isOwner && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(annotation.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="pl-9 space-y-2 border-l-2 border-border ml-3">
          {replies.map((reply) => {
            const replyInitials = (reply.user?.name ?? "U")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div key={reply.id} className="flex items-start gap-2 group">
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={reply.user?.image ?? undefined} />
                  <AvatarFallback className="text-[9px]">
                    {replyInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">
                      {reply.user?.name ?? "User"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeTime(reply.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 mt-0.5">
                    {reply.content}
                  </p>
                </div>
                {reply.userId === currentUserId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteReply(reply.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reply input */}
      {!annotation.isResolved && (
        <div className="flex items-end gap-2 pl-9">
          <textarea
            ref={textareaRef}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleReply();
              }
            }}
            placeholder="Reply… (⌘↵ to send)"
            className="flex-1 min-h-[56px] resize-none rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            disabled={isPending}
          />
          <Button
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleReply}
            disabled={!replyText.trim() || isPending}
            aria-label="Send reply"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {annotation.isResolved && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 pl-9">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Resolved
        </div>
      )}
    </div>
  );
}
