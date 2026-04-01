"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  FolderOpen,
  PenLine,
  FileSignature,
  Users,
  Settings,
  CreditCard,
  ChevronLeft,
  LayoutDashboard,
  Layers,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useUIStore } from "@/stores/ui.store";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "My Documents",
    href: "/documents",
    icon: FolderOpen,
  },
  {
    label: "Signatures",
    href: "/signatures",
    icon: FileSignature,
  },
  {
    label: "Forms",
    href: "/forms",
    icon: ClipboardList,
  },
];

const bottomNavItems = [
  {
    label: "Team",
    href: "/team",
    icon: Users,
  },
  {
    label: "Billing",
    href: "/billing",
    icon: CreditCard,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
  active: boolean;
}

function NavItem({ href, label, icon: Icon, collapsed, active }: NavItemProps) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Link href={href}>
          <Button
            variant={active ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "w-full justify-start gap-3 h-9",
              collapsed && "w-9 justify-center px-0"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </Button>
        </Link>
      </TooltipTrigger>
      {collapsed && (
        <TooltipContent side="right" className="font-medium">
          {label}
        </TooltipContent>
      )}
    </Tooltip>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, actions } = useUIStore();
  const collapsed = !sidebarOpen;

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex flex-col bg-card border-r border-border transition-all duration-200 shrink-0 relative",
          collapsed ? "w-[52px]" : "w-[220px]"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center gap-2 h-14 px-3 border-b border-border",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm tracking-tight">
              DocFlow
            </span>
          )}
        </div>

        <ScrollArea className="flex-1 px-2 py-3">
          {/* Primary navigation */}
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                collapsed={collapsed}
                active={
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)
                }
              />
            ))}
          </nav>

          <Separator className="my-3" />

          {/* Recent documents section */}
          {!collapsed && (
            <div className="px-1 mb-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Recent
              </p>
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col gap-0.5">
              {["Q1 Report.pdf", "Contract Draft.pdf", "Invoice #1042.pdf"].map(
                (doc) => (
                  <button
                    key={doc}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left"
                  >
                    <Layers className="h-3 w-3 shrink-0" />
                    <span className="truncate">{doc}</span>
                  </button>
                )
              )}
            </div>
          )}
        </ScrollArea>

        {/* Bottom nav */}
        <div className="px-2 pb-3 flex flex-col gap-0.5 border-t border-border pt-3">
          {bottomNavItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              collapsed={collapsed}
              active={pathname.startsWith(item.href)}
            />
          ))}
        </div>

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-16 z-10 h-6 w-6 rounded-full border border-border bg-background shadow-sm"
          onClick={() => actions.toggleSidebar()}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "h-3 w-3 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </aside>
    </TooltipProvider>
  );
}
