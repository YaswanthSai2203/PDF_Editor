"use client";

import { MessageSquare, CheckCircle2, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAnnotationStore } from "@/stores/annotation.store";
import { useDocumentStore } from "@/stores/document.store";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  HIGHLIGHT: "Highlight",
  UNDERLINE: "Underline",
  STRIKETHROUGH: "Strikethrough",
  RECTANGLE: "Rectangle",
  ELLIPSE: "Ellipse",
  LINE: "Line",
  ARROW: "Arrow",
  FREEHAND: "Drawing",
  TEXT: "Text",
  COMMENT: "Comment",
  STAMP: "Stamp",
  IMAGE: "Image",
  LINK: "Link",
};

const TYPE_COLORS: Record<string, string> = {
  HIGHLIGHT: "bg-yellow-100 text-yellow-800",
  UNDERLINE: "bg-blue-100 text-blue-800",
  STRIKETHROUGH: "bg-red-100 text-red-800",
  COMMENT: "bg-purple-100 text-purple-800",
  TEXT: "bg-gray-100 text-gray-800",
  SIGNATURE: "bg-green-100 text-green-800",
};

export function PanelAnnotations() {
  const { annotations, selectedAnnotationId, actions } = useAnnotationStore();
  const { actions: docActions } = useDocumentStore();

  const sorted = [...annotations]
    .filter((a) => !a.deletedAt)
    .sort((a, b) => {
      if (a.page !== b.page) return a.page - b.page;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Annotations ({sorted.length})
        </p>
      </div>
      <ScrollArea className="flex-1">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No annotations yet</p>
            <p className="text-xs text-muted-foreground/60">
              Use the tools above to add highlights, comments, and more.
            </p>
          </div>
        ) : (
          <div className="p-2 flex flex-col gap-1">
            {sorted.map((annotation) => {
                  const d = annotation.data as unknown as Record<string, unknown>;
              const previewText =
                typeof d.content === "string"
                  ? d.content
                  : typeof d.selectedText === "string"
                  ? d.selectedText
                  : null;

              return (
                <button
                  key={annotation.id}
                  className={cn(
                    "w-full text-left p-2 rounded-md border text-xs transition-colors hover:bg-accent/50",
                    selectedAnnotationId === annotation.id
                      ? "border-primary bg-primary/5"
                      : "border-transparent"
                  )}
                  onClick={() => {
                    actions.selectAnnotation(annotation.id);
                    docActions.setCurrentPage(annotation.page);
                  }}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        className={cn(
                          "text-[10px] h-4 px-1 border-none",
                          TYPE_COLORS[annotation.type] ?? "bg-gray-100 text-gray-800"
                        )}
                      >
                        {TYPE_LABELS[annotation.type] ?? annotation.type}
                      </Badge>
                      <span className="text-muted-foreground">
                        p.{annotation.page}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {!annotation.isResolved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.resolveAnnotation(annotation.id);
                          }}
                          aria-label="Resolve"
                          title="Resolve"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          actions.removeAnnotation(annotation.id);
                        }}
                        aria-label="Delete annotation"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {previewText && (
                    <p className="mt-1 text-muted-foreground line-clamp-2 text-[11px]">
                      {previewText}
                    </p>
                  )}
                  <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                    {formatRelativeTime(annotation.createdAt)}
                    {annotation.isResolved && (
                      <span className="ml-1 text-emerald-600">· resolved</span>
                    )}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
