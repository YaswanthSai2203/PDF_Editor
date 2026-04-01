import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

type SidebarPanel = "thumbnails" | "annotations" | "search" | "bookmarks" | "signatures" | null;

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarPanel: SidebarPanel;
  sidebarWidth: number;

  // Right panel (properties / comments)
  rightPanelOpen: boolean;

  // Theme
  theme: "light" | "dark" | "system";

  // Editor toolbar layout
  toolbarPosition: "top" | "left";

  // Notifications/toasts queue
  toasts: Toast[];

  actions: {
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setSidebarPanel: (panel: SidebarPanel) => void;
    setSidebarWidth: (width: number) => void;
    toggleRightPanel: () => void;
    setRightPanelOpen: (open: boolean) => void;
    setTheme: (theme: "light" | "dark" | "system") => void;
    setToolbarPosition: (pos: "top" | "left") => void;
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
  };
}

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        sidebarPanel: "thumbnails",
        sidebarWidth: 240,
        rightPanelOpen: false,
        theme: "system",
        toolbarPosition: "top",
        toasts: [],

        actions: {
          toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
          setSidebarOpen: (open) => set({ sidebarOpen: open }),
          setSidebarPanel: (panel) => set({ sidebarPanel: panel }),
          setSidebarWidth: (width) => set({ sidebarWidth: Math.max(160, Math.min(400, width)) }),
          toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
          setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
          setTheme: (theme) => set({ theme }),
          setToolbarPosition: (pos) => set({ toolbarPosition: pos }),

          addToast: (toast) =>
            set((s) => ({
              toasts: [
                ...s.toasts,
                { ...toast, id: Math.random().toString(36).slice(2) },
              ],
            })),

          removeToast: (id) =>
            set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
        },
      }),
      {
        name: "pdf-editor-ui",
        partialize: (s) => ({
          sidebarOpen: s.sidebarOpen,
          sidebarPanel: s.sidebarPanel,
          sidebarWidth: s.sidebarWidth,
          theme: s.theme,
          toolbarPosition: s.toolbarPosition,
        }),
      }
    ),
    { name: "ui-store" }
  )
);
