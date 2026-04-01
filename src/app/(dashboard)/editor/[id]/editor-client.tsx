"use client";

import { useState, useCallback } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  Layers,
  MessageSquare,
  BookOpen,
  Search,
  PenLine,
  LayoutPanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EditorToolbar } from "@/components/toolbar/editor-toolbar";
import { PDFViewer } from "@/components/pdf/pdf-viewer";
import { PanelThumbnails } from "@/components/sidebar/panel-thumbnails";
import { PanelAnnotations } from "@/components/sidebar/panel-annotations";
import { useDocumentStore } from "@/stores/document.store";
import { useAnnotations } from "@/hooks/use-annotations";
import { cn } from "@/lib/utils";

interface EditorClientProps {
  document: {
    id: string;
    title: string;
    url: string;
    userId: string;
  };
}

type EditorPanel = "thumbnails" | "annotations" | "bookmarks" | "search" | "signatures" | null;

const panelIcons: Array<{
  id: EditorPanel;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "thumbnails", label: "Pages", icon: Layers },
  { id: "annotations", label: "Annotations", icon: MessageSquare },
  { id: "bookmarks", label: "Bookmarks", icon: BookOpen },
  { id: "search", label: "Search", icon: Search },
  { id: "signatures", label: "Signatures", icon: PenLine },
];

export function EditorClient({ document }: EditorClientProps) {
  const [loadedDoc, setLoadedDoc] = useState<PDFDocumentProxy | null>(null);
  const [activePanel, setActivePanel] = useState<EditorPanel>("thumbnails");
  const { actions: docActions } = useDocumentStore();

  // Auto-save annotations to DB
  const { saveNow, isSaving } = useAnnotations(document.id);

  const handleDocumentLoaded = useCallback(
    (doc: PDFDocumentProxy) => {
      setLoadedDoc(doc);
      docActions.setActiveDocument(document.id, document.title, document.url, doc.numPages);
      docActions.setTotalPages(doc.numPages);
    },
    [document, docActions]
  );

  const togglePanel = (panel: EditorPanel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Top toolbar */}
        <EditorToolbar documentTitle={document.title} isSaving={isSaving} onSave={saveNow} />

        <div className="flex flex-1 overflow-hidden">
          {/* Left icon rail */}
          <div className="flex flex-col items-center gap-0.5 py-2 px-1 border-r border-border bg-card w-10 shrink-0">
            {panelIcons.map(({ id, label, icon: Icon }) => (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activePanel === id ? "secondary" : "ghost"}
                    size="icon"
                    className={cn(
                      "h-8 w-8",
                      activePanel === id && "bg-primary/10 text-primary"
                    )}
                    onClick={() => togglePanel(id)}
                    aria-label={label}
                    aria-pressed={activePanel === id}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Left panel (conditional) */}
          {activePanel && (
            <div className="w-[180px] shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
              {loadedDoc && activePanel === "thumbnails" && (
                <PanelThumbnails document={loadedDoc} />
              )}
              {activePanel === "annotations" && <PanelAnnotations />}
              {(activePanel === "bookmarks" || activePanel === "search" || activePanel === "signatures") && (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center gap-2">
                  <LayoutPanelLeft className="h-6 w-6 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    {activePanel === "bookmarks"
                      ? "No bookmarks"
                      : activePanel === "search"
                      ? "Search coming soon"
                      : "No signature requests"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Main PDF viewport */}
          <PDFViewer
            documentId={document.id}
            url={document.url}
            userId={document.userId}
            onDocumentLoaded={handleDocumentLoaded}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
