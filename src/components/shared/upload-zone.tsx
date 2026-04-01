"use client";

import { useCallback, useState, useId } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, formatBytes } from "@/lib/utils";
import { useUpload } from "@/hooks/use-upload";

interface UploadZoneProps {
  onSuccess?: (documentId: string) => void;
  redirectToEditor?: boolean;
  className?: string;
  compact?: boolean;
}

export function UploadZone({
  onSuccess,
  redirectToEditor = true,
  className,
  compact = false,
}: UploadZoneProps) {
  const router = useRouter();
  const inputId = useId();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { state, upload, cancel, reset } = useUpload({
    redirectToEditor,
    onSuccess: (id) => {
      onSuccess?.(id);
      if (!redirectToEditor) {
        router.refresh();
      }
    },
  });

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const file = Array.from(files).find(
        (f) => f.type === "application/pdf" || f.name.endsWith(".pdf")
      );
      if (!file) return;
      setSelectedFile(file);
      upload(file);
    },
    [upload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
    }
  };

  const isActive = state.status !== "idle" && state.status !== "error";

  if (compact) {
    return (
      <div className={cn("relative", className)}>
        <input
          id={inputId}
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={handleFileInput}
          disabled={isActive}
        />
        <label htmlFor={inputId}>
          <Button
            asChild
            size="sm"
            disabled={isActive}
            className="cursor-pointer"
          >
            <span>
              {isActive ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {isActive ? `Uploading ${state.progress}%` : "Upload PDF"}
            </span>
          </Button>
        </label>
      </div>
    );
  }

  // Full drop-zone mode
  if (state.status === "done") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800 p-10",
          className
        )}
      >
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        <div className="text-center">
          <p className="font-medium text-emerald-800 dark:text-emerald-200">
            Upload complete!
          </p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
            {selectedFile?.name}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          Upload another
        </Button>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-destructive/30 bg-destructive/5 p-10",
          className
        )}
      >
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div className="text-center">
          <p className="font-medium text-destructive">Upload failed</p>
          <p className="text-sm text-muted-foreground mt-0.5">{state.error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          Try again
        </Button>
      </div>
    );
  }

  if (isActive) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-10",
          className
        )}
      >
        <FileText className="h-10 w-10 text-primary" />
        <div className="w-full max-w-xs space-y-1.5 text-center">
          <p className="text-sm font-medium truncate">{selectedFile?.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(selectedFile?.size ?? 0)} ·{" "}
            {state.status === "preparing"
              ? "Preparing…"
              : state.status === "uploading"
              ? `Uploading ${state.progress}%`
              : "Processing…"}
          </p>
          <Progress value={state.status === "processing" ? 100 : state.progress} className="h-1.5" />
        </div>
        <Button variant="ghost" size="sm" onClick={cancel}>
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-colors cursor-pointer",
        isDragOver
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-accent/30",
        className
      )}
      role="button"
      tabIndex={0}
      aria-label="Upload PDF — click or drag and drop"
      onClick={() => document.getElementById(inputId)?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          document.getElementById(inputId)?.click();
        }
      }}
    >
      <input
        id={inputId}
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        onChange={handleFileInput}
      />

      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full transition-colors",
          isDragOver ? "bg-primary/15" : "bg-muted"
        )}
      >
        <Upload
          className={cn(
            "h-6 w-6 transition-colors",
            isDragOver ? "text-primary" : "text-muted-foreground"
          )}
        />
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm font-medium">
          {isDragOver ? "Drop your PDF here" : "Drag & drop a PDF or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground">
          PDF files up to 500 MB
        </p>
      </div>

      <Button variant="outline" size="sm" tabIndex={-1}>
        Choose file
      </Button>
    </div>
  );
}
