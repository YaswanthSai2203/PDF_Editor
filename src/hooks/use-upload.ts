"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export interface UploadState {
  status: "idle" | "preparing" | "uploading" | "processing" | "done" | "error";
  progress: number; // 0-100
  documentId: string | null;
  error: string | null;
}

export interface UseUploadOptions {
  onSuccess?: (documentId: string) => void;
  onError?: (error: string) => void;
  redirectToEditor?: boolean;
}

/**
 * useUpload — two-phase upload:
 * 1. POST /api/upload → get presigned PUT URL + documentId
 * 2. PUT to S3 directly with XMLHttpRequest (for progress events)
 * 3. PATCH /api/documents/:id to mark READY
 */
export function useUpload(options: UseUploadOptions = {}) {
  const router = useRouter();
  const [state, setState] = useState<UploadState>({
    status: "idle",
    progress: 0,
    documentId: null,
    error: null,
  });

  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const upload = useCallback(
    async (file: File) => {
      if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
        setState((s) => ({
          ...s,
          status: "error",
          error: "Only PDF files are supported.",
        }));
        options.onError?.("Only PDF files are supported.");
        return;
      }

      setState({ status: "preparing", progress: 0, documentId: null, error: null });

      try {
        // ── Phase 1: get presigned URL ───────────────────────────────────
        const prepRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: "application/pdf",
            fileSize: file.size,
            title: file.name.replace(/\.pdf$/i, ""),
          }),
        });

        if (!prepRes.ok) {
          const body = await prepRes.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to prepare upload.");
        }

        const { data } = await prepRes.json();
        const { documentId, uploadUrl } = data;

        setState((s) => ({ ...s, documentId, status: "uploading" }));

        // ── Phase 2: PUT directly to S3 ──────────────────────────────────
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setState((s) => ({ ...s, progress: pct }));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error during upload."));
          xhr.onabort = () => reject(new Error("Upload was cancelled."));

          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", "application/pdf");
          xhr.send(file);
        });

        // ── Phase 3: mark document as ready ──────────────────────────────
        setState((s) => ({ ...s, status: "processing", progress: 100 }));

        await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "READY" }),
        });

        setState((s) => ({ ...s, status: "done" }));
        options.onSuccess?.(documentId);

        if (options.redirectToEditor) {
          router.push(`/editor/${documentId}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed.";
        setState((s) => ({ ...s, status: "error", error: message }));
        options.onError?.(message);
      }
    },
    [options, router]
  );

  const cancel = useCallback(() => {
    xhrRef.current?.abort();
    setState({ status: "idle", progress: 0, documentId: null, error: null });
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle", progress: 0, documentId: null, error: null });
  }, []);

  return { state, upload, cancel, reset };
}
