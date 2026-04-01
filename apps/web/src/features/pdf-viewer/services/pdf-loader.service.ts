"use client";

import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist";

import { env } from "@/lib/env";

let workerConfigured = false;

async function loadPdfJs() {
  return import("pdfjs-dist/legacy/build/pdf.mjs");
}

function ensureBrowserContext(): void {
  if (typeof window === "undefined") {
    throw new Error("PDF rendering can only run in the browser.");
  }
}

export interface LoadPdfInput {
  sourceUrl: string;
}

export interface PdfLoaderService {
  load(input: LoadPdfInput): Promise<PDFDocumentProxy>;
}

export class PdfJsLoaderService implements PdfLoaderService {
  async load(input: LoadPdfInput): Promise<PDFDocumentProxy> {
    ensureBrowserContext();
    const pdfjs = await loadPdfJs();
    if (!workerConfigured) {
      pdfjs.GlobalWorkerOptions.workerSrc = env.NEXT_PUBLIC_PDF_WORKER_PATH;
      workerConfigured = true;
    }

    const task: PDFDocumentLoadingTask = pdfjs.getDocument({
      url: input.sourceUrl,
      withCredentials: false,
      disableAutoFetch: false,
    });

    return task.promise;
  }
}
