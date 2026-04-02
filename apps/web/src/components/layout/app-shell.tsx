"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Layers, PenTool, Signature, TextCursorInput } from "lucide-react";

import { AppShellHeader } from "@/components/layout/app-shell-header";
import { appConfig } from "@/config/app-config";
import { cn } from "@/lib/utils";

type IconComponent = typeof FileText;

const navIcons: Record<string, IconComponent> = {
  Viewer: FileText,
  Annotate: PenTool,
  Organize: Layers,
  Sign: Signature,
  Forms: TextCursorInput,
};

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="border-r border-zinc-200 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-950">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-2 text-base font-semibold text-zinc-900 dark:text-zinc-100"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900">
            NP
          </span>
          <span>{appConfig.name}</span>
        </Link>

        <nav className="mt-8 space-y-1">
          {appConfig.navigation.map((item) => {
            const Icon = navIcons[item.title] ?? FileText;
            const isDisabled = Boolean(item.disabled);
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={isDisabled ? "#" : item.href}
                aria-disabled={isDisabled}
                aria-current={isActive && !isDisabled ? "page" : undefined}
                className={cn(
                  "group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
                  "hover:bg-zinc-100 dark:hover:bg-zinc-900",
                  isDisabled && "cursor-not-allowed opacity-50",
                  isActive &&
                    !isDisabled &&
                    "bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700",
                )}
              >
                <Icon className="mt-0.5 h-4 w-4 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {item.title}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 bg-zinc-50 dark:bg-zinc-950">
        <AppShellHeader />
        <div className="h-[calc(100vh-56px)] overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
