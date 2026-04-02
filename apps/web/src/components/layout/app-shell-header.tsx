"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Building2, ChevronRight, FileText } from "lucide-react";

import { appConfig } from "@/config/app-config";

function normalizeSegment(segment: string): string {
  return segment.charAt(0).toUpperCase() + segment.slice(1).replaceAll("-", " ");
}

export function AppShellHeader() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const firstSegment = `/${pathSegments[0] ?? ""}`;
    const navMatch = appConfig.navigation.find((item) => item.href === firstSegment);

    const mappedSegments = pathSegments.map((segment, index) => {
      if (index === 0 && navMatch) {
        return navMatch.title;
      }
      return normalizeSegment(segment);
    });

    return ["Workspace", ...mappedSegments];
  }, [pathname]);

  const documentLabel =
    pathname === "/viewer"
      ? "Viewer document"
      : pathname === "/annotate"
        ? "Annotating"
        : pathname === "/organize"
          ? "Organizing pages"
          : pathname === "/sign"
            ? "Signing"
            : pathname === "/forms"
              ? "Forms"
              : "No document selected";
  const activeWorkspace =
    appConfig.workspaces.find((item) => item.id === appConfig.defaultWorkspaceId) ??
    appConfig.workspaces[0];

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
            {breadcrumbs.map((crumb, index) => (
              <span key={`${crumb}-${index}`} className="inline-flex items-center gap-1">
                {index > 0 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
                <span className={index === breadcrumbs.length - 1 ? "text-zinc-900 dark:text-zinc-100" : ""}>
                  {crumb}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="hidden items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-sm text-zinc-600 md:flex dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            <Building2 className="h-4 w-4" />
            <select
              defaultValue={activeWorkspace.id}
              className="bg-transparent text-sm text-zinc-900 outline-none dark:text-zinc-100"
              aria-label="Workspace switcher"
            >
              {appConfig.workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id} className="bg-white dark:bg-zinc-900">
                  {workspace.name}
                </option>
              ))}
            </select>
          </label>

          <div className="inline-flex max-w-[320px] items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{documentLabel}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
