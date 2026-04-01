import type { ReactNode } from "react";

import { AppShell } from "@/features/workspace/presentation/app-shell";

type WorkspaceLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
