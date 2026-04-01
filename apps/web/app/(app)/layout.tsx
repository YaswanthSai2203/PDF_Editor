import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
