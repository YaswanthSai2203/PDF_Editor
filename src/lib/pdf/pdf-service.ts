"use client";

/**
 * PDF Service — thin wrapper around PDF.js
 *
 * Responsibilities:
 * - Load PDF documents from URL or ArrayBuffer
 * - Render individual pages to canvas
 * - Extract text content per page
 * - Generate page thumbnails
 *
 * Design decision: we keep PDF.js as a singleton worker (loaded once)
 * and expose an async API that the React layer consumes.
 */

import type {
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask,
} from "pdfjs-dist";

// PDF.js must be loaded in the browser only — the worker is served from /public
let pdfjsLib: typeof import("pdfjs-dist") | null = null;

async function getPDFjs() {
  if (pdfjsLib) return pdfjsLib;
  const lib = await import("pdfjs-dist");
  // Point to the worker bundled in /public
  lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  pdfjsLib = lib;
  return lib;
}

export interface PDFPageDimensions {
  width: number;
  height: number;
  rotation: number;
}

export interface PDFTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

export class PDFService {
  private static loadingTasks: Map<string, Promise<PDFDocumentProxy>> =
    new Map();

  /**
   * Load a PDF document from a URL, returning the PDFDocumentProxy.
   * Results are cached by URL to avoid re-fetching.
   */
  static async loadDocument(url: string): Promise<PDFDocumentProxy> {
    if (this.loadingTasks.has(url)) {
      return this.loadingTasks.get(url)!;
    }

    const lib = await getPDFjs();
    const task = lib.getDocument({
      url,
      cMapUrl: "https://unpkg.com/pdfjs-dist/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "https://unpkg.com/pdfjs-dist/standard_fonts/",
    }).promise;

    this.loadingTasks.set(url, task);

    task.catch(() => {
      // Remove failed loads from cache so retry works
      this.loadingTasks.delete(url);
    });

    return task;
  }

  /**
   * Load a PDF document from raw bytes (e.g. after upload, before S3 storage)
   */
  static async loadFromArrayBuffer(
    data: ArrayBuffer
  ): Promise<PDFDocumentProxy> {
    const lib = await getPDFjs();
    return lib.getDocument({ data }).promise;
  }

  /**
   * Get dimensions for a specific page at a given scale
   */
  static async getPageDimensions(
    doc: PDFDocumentProxy,
    pageNumber: number,
    scale = 1.0
  ): Promise<PDFPageDimensions> {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale, rotation: 0 });
    return {
      width: viewport.width,
      height: viewport.height,
      rotation: viewport.rotation,
    };
  }

  /**
   * Render a page to an existing <canvas> element.
   * Returns the RenderTask so the caller can cancel if needed.
   */
  static async renderPage(
    page: PDFPageProxy,
    canvas: HTMLCanvasElement,
    scale: number,
    rotation = 0
  ): Promise<RenderTask> {
    const viewport = page.getViewport({ scale, rotation });

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get 2D canvas context");

    // Support HiDPI displays
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.height = viewport.height * devicePixelRatio;
    canvas.width = viewport.width * devicePixelRatio;
    canvas.style.height = `${viewport.height}px`;
    canvas.style.width = `${viewport.width}px`;

    context.scale(devicePixelRatio, devicePixelRatio);

    const renderTask = page.render({
      canvas,
      viewport,
      canvasContext: context,
    });

    return renderTask;
  }

  /**
   * Render a page to a new OffscreenCanvas for use as a thumbnail.
   * Falls back to a regular canvas if OffscreenCanvas is unsupported.
   */
  static async renderThumbnail(
    doc: PDFDocumentProxy,
    pageNumber: number,
    targetWidth = 150
  ): Promise<string> {
    const page = await doc.getPage(pageNumber);
    const naturalViewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / naturalViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext("2d")!;

    await page.render({ canvas, canvasContext: context, viewport }).promise;
    return canvas.toDataURL("image/jpeg", 0.85);
  }

  /**
   * Extract text content from a page, returning positioned items.
   */
  static async extractPageText(
    page: PDFPageProxy,
    scale = 1.0
  ): Promise<PDFTextItem[]> {
    const [textContent, viewport] = await Promise.all([
      page.getTextContent(),
      Promise.resolve(page.getViewport({ scale })),
    ]);

    return textContent.items
      .filter((item): item is import("pdfjs-dist/types/src/display/api").TextItem =>
        "str" in item
      )
      .map((item) => {
        const [, , , , tx, ty] = item.transform;
        return {
          text: item.str,
          x: tx * scale,
          y: viewport.height - ty * scale,
          width: item.width * scale,
          height: item.height * scale,
          fontSize: item.height,
        };
      });
  }

  /**
   * Destroy a loaded document to free memory
   */
  static destroyDocument(url: string, doc: PDFDocumentProxy) {
    doc.destroy();
    this.loadingTasks.delete(url);
  }
}
