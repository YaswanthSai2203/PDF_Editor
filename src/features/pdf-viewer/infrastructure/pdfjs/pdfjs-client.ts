"use client";

import { ensurePdfJsWorker } from "@/features/pdf-viewer/infrastructure/pdfjs/pdfjs-worker";

type PdfJsModule = typeof import("pdfjs-dist");
type PDFDocumentProxy = import("pdfjs-dist").PDFDocumentProxy;
type PDFPageProxy = import("pdfjs-dist").PDFPageProxy;

let pdfJsModulePromise: Promise<PdfJsModule> | null = null;

async function getPdfJsModule(): Promise<PdfJsModule> {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = import("pdfjs-dist");
  }

  return pdfJsModulePromise;
}

export async function loadPdfDocument(url: string): Promise<PDFDocumentProxy> {
  ensurePdfJsWorker();

  const { getDocument, GlobalWorkerOptions, version } = await getPdfJsModule();
  GlobalWorkerOptions.workerSrc ||= "/pdf.worker.min.mjs";

  const task = getDocument({
    url,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${version}/standard_fonts/`,
  });

  return task.promise;
}

export async function renderPdfPage(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale: number,
): Promise<void> {
  const viewport = page.getViewport({ scale });
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("2D canvas context is unavailable.");
  }

  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.width * ratio);
  canvas.height = Math.floor(viewport.height * ratio);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvas,
    canvasContext: context,
    viewport,
  }).promise;
}
