"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  FileText,
  FolderKanban,
  LayoutGrid,
  Search,
  Settings,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type NavigationIcon,
  primaryNavigation,
  secondaryNavigation,
  workspaceTabs,
} from "@/features/workspace/config/navigation";
import { cn } from "@/lib/utils";

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

const iconMap: Record<NavigationIcon, ComponentType<{ className?: string }>> = {
  bell: Bell,
  "file-text": FileText,
  "folder-kanban": FolderKanban,
  "layout-grid": LayoutGrid,
  search: Search,
  settings: Settings,
  users: Users,
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_35%),linear-gradient(180deg,_#0b1020_0%,_#0f172a_45%,_#111827_100%)] text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950/35 backdrop-blur xl:flex xl:flex-col">
          <div className="border-b border-white/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-sm font-semibold text-sky-300 ring-1 ring-sky-400/40">
                PX
              </div>
              <div>
                <p className="text-sm font-semibold">PDFX Studio</p>
                <p className="text-xs text-slate-400">Premium editing workspace</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-8 px-4 py-6">
            <div className="space-y-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Product</p>
              {primaryNavigation.map((item) => {
                const Icon = iconMap[item.icon];
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-sky-500/15 text-white ring-1 ring-sky-400/30"
                        : "text-slate-300 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? <Badge variant="secondary">{item.badge}</Badge> : null}
                  </Link>
                );
              })}
            </div>

            <div className="space-y-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
              {workspaceTabs.map((item) => {
                const Icon = iconMap[item.icon];

                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-400"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-white/10 p-4">
            {secondaryNavigation.map((item) => {
              const Icon = iconMap[item.icon];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/45 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">Phase 1</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight">Document workspace shell</h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="ghost" size="sm">
                  Invite reviewers
                </Button>
                <Button variant="secondary" size="sm">
                  Save draft
                </Button>
                <Button size="sm">Export PDF</Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
