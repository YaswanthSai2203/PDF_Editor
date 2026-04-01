"use client";

import { ScanText } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { OcrJobEntity } from "@/features/ocr/domain/ocr-job";

interface OcrPanelProps {
  jobs: OcrJobEntity[];
  activePageNumber: number;
  activePageText?: string;
  canRunJob: boolean;
  onRunJob: () => void;
  onSelectJob: (jobId: string) => void;
}

export function OcrPanel({
  jobs,
  activePageNumber,
  activePageText,
  canRunJob,
  onRunJob,
  onSelectJob,
}: OcrPanelProps) {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <div className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            OCR pipeline
          </h3>
        </div>
        <Button
          size="sm"
          className="gap-1"
          disabled={!canRunJob}
          onClick={onRunJob}
        >
          <ScanText className="h-4 w-4" />
          Run OCR
        </Button>
      </div>

      <div className="grid min-h-0 grid-rows-[220px_1fr]">
        <div className="space-y-2 overflow-y-auto border-b border-zinc-200 p-3 dark:border-zinc-800">
          {jobs.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No OCR jobs yet.
            </p>
          ) : (
            jobs.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => onSelectJob(job.id)}
                className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-2 py-2 text-left text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <div className="font-medium text-zinc-800 dark:text-zinc-100">
                  {job.provider}
                </div>
                <div className="text-zinc-500 dark:text-zinc-400">{job.status}</div>
              </button>
            ))
          )}
        </div>

        <div className="min-h-0 overflow-y-auto p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            Extracted text (page {activePageNumber})
          </h4>
          {activePageText ? (
            <pre className="whitespace-pre-wrap rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              {activePageText}
            </pre>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Run OCR and select a job to see text for this page.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
