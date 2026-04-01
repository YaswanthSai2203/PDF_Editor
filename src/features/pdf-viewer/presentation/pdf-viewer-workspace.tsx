"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { FileText, Highlighter, PenTool, Search, Sparkles, Type } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ViewerDocument } from "@/features/pdf-viewer/domain/pdf-document";
import { PdfToolbar } from "@/features/pdf-viewer/presentation/pdf-toolbar";
import { cn } from "@/lib/utils";

type PdfViewerWorkspaceProps = {
  document: ViewerDocument;
};

const toolSections = [
  {
    title: "Review",
    items: [
      { label: "Select", icon: FileText, active: true },
      { label: "Highlight", icon: Highlighter },
      { label: "Comment", icon: Search },
    ],
  },
  {
    title: "Editing",
    items: [
      { label: "Text", icon: Type },
      { label: "Draw", icon: PenTool },
      { label: "AI assist", icon: Sparkles },
    ],
  },
];

const PdfCanvas = dynamic(
  () =>
    import("@/features/pdf-viewer/presentation/pdf-canvas").then((module) => ({
      default: module.PdfCanvas,
    })),
  {
    ssr: false,
  },
);

export function PdfViewerWorkspace({ document }: PdfViewerWorkspaceProps) {
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.1);

  const pageLabel = useMemo(
    () => `${pageNumber} / ${document.pageCount} pages`,
    [document.pageCount, pageNumber],
  );

  const sourceUrl = document.source.kind === "url" ? document.source.url : document.source.path;

  return (
    <div className="grid min-h-[calc(100vh-8rem)] gap-4 xl:grid-cols-[18rem_minmax(0,1fr)_22rem]">
      <Card className="hidden border-border/60 bg-card/80 xl:flex xl:flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {toolSections.map((section) => (
            <div key={section.title} className="space-y-3">
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                {section.title}
              </div>
              <div className="space-y-2">
                {section.items.map(({ label, icon: Icon, active }) => (
                  <button
                    key={label}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition",
                      active
                        ? "border-primary/40 bg-primary/10 text-foreground shadow-sm"
                        : "border-border/60 bg-background/40 text-muted-foreground hover:border-border hover:bg-background/70 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Separator />
          <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4">
            <div className="text-sm font-semibold">Planned service modules</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Editing, OCR, signatures, collaboration, and AI are isolated behind
              domain services so premium capabilities can evolve independently of
              the viewer UI.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <PdfToolbar
          documentName={document.name}
          pageNumber={pageNumber}
          totalPages={document.pageCount}
          scale={scale}
          onPreviousPage={() => setPageNumber((current) => Math.max(current - 1, 1))}
          onNextPage={() =>
            setPageNumber((current) => Math.min(current + 1, document.pageCount))
          }
          onZoomIn={() => setScale((current) => Math.min(current + 0.1, 2.5))}
          onZoomOut={() => setScale((current) => Math.max(current - 0.1, 0.5))}
        />

        <Card className="overflow-hidden border-border/60 bg-[#0a0d14] shadow-[0_30px_80px_-30px_rgba(15,23,42,0.75)]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-100">
                Secure workspace
              </div>
              <span>{document.category}</span>
            </div>
            <div className="text-xs text-slate-400">{pageLabel}</div>
          </div>
          <div className="min-h-[70vh] bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_42%),linear-gradient(180deg,#111827_0%,#0a0d14_100%)] p-6">
            <PdfCanvas
              fileUrl={sourceUrl}
              pageNumber={pageNumber}
              scale={scale}
            />
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Document summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">{document.name}</div>
                <div className="text-muted-foreground">{document.ownerName}</div>
              </div>
              <div className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-100">
                {document.accessLevel}
              </div>
            </div>
            <Separator />
            <dl className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Pages</dt>
                <dd>{document.pageCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Storage</dt>
                <dd>{document.storageProvider}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Version</dt>
                <dd>{document.versionLabel}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Last activity</dt>
                <dd>{new Date(document.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Phase 1 goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Establish a durable app shell, typed service boundaries, and a
              production-oriented viewer that can accept annotations, editing
              overlays, and collaboration cursors later without rewrites.
            </p>
            <ul className="space-y-2">
              <li>- Server-provided document metadata</li>
              <li>- PDF.js-backed canvas rendering</li>
              <li>- {pageLabel} navigation and zoom controls</li>
              <li>- Responsive navigation for future premium workflows</li>
              <li>- Service abstractions for storage and editing pipelines</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
