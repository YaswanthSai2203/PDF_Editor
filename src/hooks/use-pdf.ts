"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { PDFService } from "@/lib/pdf/pdf-service";

interface UsePDFOptions {
  url: string | null;
  initialPage?: number;
  scale?: number;
}

interface UsePDFReturn {
  document: PDFDocumentProxy | null;
  numPages: number;
  currentPage: number;
  scale: number;
  isLoading: boolean;
  error: string | null;
  getPage: (pageNumber: number) => Promise<PDFPageProxy | null>;
  goToPage: (page: number) => void;
  setScale: (scale: number) => void;
}

export function usePDF({
  url,
  initialPage = 1,
  scale: initialScale = 1.0,
}: UsePDFOptions): UsePDFReturn {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [scale, setScaleState] = useState(initialScale);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep track of last loaded url to clean up
  const loadedUrlRef = useRef<string | null>(null);
  const documentRef = useRef<PDFDocumentProxy | null>(null);

  useEffect(() => {
    if (!url) {
      setDocument(null);
      setNumPages(0);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    PDFService.loadDocument(url)
      .then((doc) => {
        if (cancelled) return;
        documentRef.current = doc;
        loadedUrlRef.current = url;
        setDocument(doc);
        setNumPages(doc.numPages);
        setCurrentPage(initialPage);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load PDF:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load PDF document"
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url, initialPage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (documentRef.current && loadedUrlRef.current) {
        PDFService.destroyDocument(loadedUrlRef.current, documentRef.current);
      }
    };
  }, []);

  const getPage = useCallback(
    async (pageNumber: number): Promise<PDFPageProxy | null> => {
      if (!document) return null;
      if (pageNumber < 1 || pageNumber > numPages) return null;
      try {
        return await document.getPage(pageNumber);
      } catch (err) {
        console.error(`Failed to get page ${pageNumber}:`, err);
        return null;
      }
    },
    [document, numPages]
  );

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(numPages, page));
      setCurrentPage(clamped);
    },
    [numPages]
  );

  const setScale = useCallback((s: number) => {
    const clamped = Math.max(0.25, Math.min(5.0, s));
    setScaleState(clamped);
  }, []);

  return {
    document,
    numPages,
    currentPage,
    scale,
    isLoading,
    error,
    getPage,
    goToPage,
    setScale,
  };
}
