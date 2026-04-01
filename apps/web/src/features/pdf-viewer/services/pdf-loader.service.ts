"use client";

import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy,
} from "pdfjs-dist";

import { env } from "@/lib/env";

let workerConfigured = false;

function ensurePdfWorker(): void {
  if (workerConfigured) {
    return;
  }

  GlobalWorkerOptions.workerSrc = env.NEXT_PUBLIC_PDF_WORKER_PATH;
  workerConfigured = true;
}

export interface LoadPdfInput {
  sourceUrl: string;
}

export interface PdfLoaderService {
  load(input: LoadPdfInput): Promise<PDFDocumentProxy>;
}

export class PdfJsLoaderService implements PdfLoaderService {
  async load(input: LoadPdfInput): Promise<PDFDocumentProxy> {
    ensurePdfWorker();
    const task: PDFDocumentLoadingTask = getDocument({
      url: input.sourceUrl,
      withCredentials: false,
      disableAutoFetch: false,
    });

    return task.promise;
  }
}
