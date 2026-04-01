"use client";

import { GlobalWorkerOptions } from "pdfjs-dist";

let workerConfigured = false;

export function ensurePdfJsWorker(): void {
  if (workerConfigured) {
    return;
  }

  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  workerConfigured = true;
}
