import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { DocumentListItem } from "@/types/document";

interface DocumentState {
  // Active document in the editor
  activeDocumentId: string | null;
  activeDocumentTitle: string | null;
  activeDocumentUrl: string | null;
  pageCount: number;

  // Document list
  documents: DocumentListItem[];
  isLoadingDocuments: boolean;

  // Viewer state
  currentPage: number;
  totalPages: number;
  scale: number;
  rotation: number; // 0, 90, 180, 270
  fitMode: "page" | "width" | "height" | "custom";

  // Upload state
  isUploading: boolean;
  uploadProgress: number;

  actions: {
    setActiveDocument: (
      id: string,
      title: string,
      url: string,
      pageCount?: number
    ) => void;
    clearActiveDocument: () => void;
    setDocuments: (docs: DocumentListItem[]) => void;
    setLoadingDocuments: (loading: boolean) => void;
    setCurrentPage: (page: number) => void;
    setTotalPages: (total: number) => void;
    setScale: (scale: number) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    setRotation: (rotation: number) => void;
    rotateCW: () => void;
    setFitMode: (mode: "page" | "width" | "height" | "custom") => void;
    setIsUploading: (uploading: boolean) => void;
    setUploadProgress: (progress: number) => void;
    removeDocument: (id: string) => void;
  };
}

const ZOOM_STEP = 0.25;
const MIN_SCALE = 0.25;
const MAX_SCALE = 5.0;

export const useDocumentStore = create<DocumentState>()(
  devtools(
    (set) => ({
      activeDocumentId: null,
      activeDocumentTitle: null,
      activeDocumentUrl: null,
      pageCount: 0,
      documents: [],
      isLoadingDocuments: false,
      currentPage: 1,
      totalPages: 0,
      scale: 1.0,
      rotation: 0,
      fitMode: "width",
      isUploading: false,
      uploadProgress: 0,

      actions: {
        setActiveDocument: (id, title, url, pageCount = 0) =>
          set({
            activeDocumentId: id,
            activeDocumentTitle: title,
            activeDocumentUrl: url,
            pageCount,
            currentPage: 1,
            scale: 1.0,
            rotation: 0,
          }),

        clearActiveDocument: () =>
          set({
            activeDocumentId: null,
            activeDocumentTitle: null,
            activeDocumentUrl: null,
            pageCount: 0,
            currentPage: 1,
          }),

        setDocuments: (docs) => set({ documents: docs }),
        setLoadingDocuments: (loading) => set({ isLoadingDocuments: loading }),
        setCurrentPage: (page) => set({ currentPage: page }),
        setTotalPages: (total) => set({ totalPages: total }),

        setScale: (scale) =>
          set({ scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale)), fitMode: "custom" }),

        zoomIn: () =>
          set((s) => ({
            scale: Math.min(MAX_SCALE, Math.round((s.scale + ZOOM_STEP) * 100) / 100),
            fitMode: "custom",
          })),

        zoomOut: () =>
          set((s) => ({
            scale: Math.max(MIN_SCALE, Math.round((s.scale - ZOOM_STEP) * 100) / 100),
            fitMode: "custom",
          })),

        resetZoom: () => set({ scale: 1.0, fitMode: "custom" }),

        setRotation: (rotation) => set({ rotation }),

        rotateCW: () =>
          set((s) => ({ rotation: (s.rotation + 90) % 360 })),

        setFitMode: (mode) => set({ fitMode: mode }),

        setIsUploading: (uploading) => set({ isUploading: uploading }),
        setUploadProgress: (progress) => set({ uploadProgress: progress }),

        removeDocument: (id) =>
          set((s) => ({
            documents: s.documents.filter((d) => d.id !== id),
          })),
      },
    }),
    { name: "document-store" }
  )
);
