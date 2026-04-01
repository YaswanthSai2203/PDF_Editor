"use client";

import { GitBranch, MessageSquarePlus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  CollaborationActivityEntity,
  CollaborationCommentEntity,
  CollaborationVersionEntity,
} from "@/features/collaboration/domain/collaboration";

interface CollaborationPanelProps {
  activePageNumber: number;
  comments: CollaborationCommentEntity[];
  versions: CollaborationVersionEntity[];
  activity: CollaborationActivityEntity[];
  canPersist: boolean;
  onCreateComment: (input: { body: string; pageNumber: number }) => void;
  onCreateVersion: (input: { source: "EDIT" | "OCR" | "SIGNATURE" | "API" }) => void;
  onRefresh: () => void;
}

export function CollaborationPanel({
  activePageNumber,
  comments,
  versions,
  activity,
  canPersist,
  onCreateComment,
  onCreateVersion,
  onRefresh,
}: CollaborationPanelProps) {
  const pageComments = comments.filter(
    (comment) => comment.pageNumber === activePageNumber,
  );

  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <div className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Collaboration
          </h3>
          <Button
            size="icon"
            variant="ghost"
            onClick={onRefresh}
            aria-label="Refresh collaboration data"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="gap-1"
            disabled={!canPersist}
            onClick={() =>
              onCreateComment({
                body: `Comment on page ${activePageNumber}`,
                pageNumber: activePageNumber,
              })
            }
          >
            <MessageSquarePlus className="h-4 w-4" />
            Add comment
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            disabled={!canPersist}
            onClick={() => onCreateVersion({ source: "EDIT" })}
          >
            <GitBranch className="h-4 w-4" />
            Save version
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 grid-rows-[200px_190px_1fr]">
        <section className="overflow-y-auto border-b border-zinc-200 p-3 dark:border-zinc-800">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            Page comments ({activePageNumber})
          </h4>
          {pageComments.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No comments on this page yet.
            </p>
          ) : (
            <div className="space-y-2">
              {pageComments.map((comment) => (
                <article
                  key={comment.id}
                  className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <p className="text-zinc-800 dark:text-zinc-100">{comment.body}</p>
                  <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                    {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-y-auto border-b border-zinc-200 p-3 dark:border-zinc-800">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            Versions
          </h4>
          {versions.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No versions yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {versions.map((version) => (
                <li
                  key={version.id}
                  className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <div className="font-medium text-zinc-800 dark:text-zinc-100">
                    v{version.versionNumber} · {version.source}
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400">
                    {version.pageCount} pages
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-y-auto p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            Activity
          </h4>
          {activity.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No activity events yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {activity.map((event) => (
                <li
                  key={event.id}
                  className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <div className="font-medium text-zinc-800 dark:text-zinc-100">
                    {event.type}
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400">
                    {new Date(event.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
