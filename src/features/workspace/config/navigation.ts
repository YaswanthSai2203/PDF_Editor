export type NavigationIcon =
  | "layout-grid"
  | "file-text"
  | "folder-kanban"
  | "search"
  | "bell"
  | "users"
  | "settings";

export type WorkspaceRoute = {
  label: string;
  href: string;
  icon: NavigationIcon;
  badge?: string;
};

export const primaryNavigation: WorkspaceRoute[] = [
  {
    label: "Overview",
    href: "/viewer",
    icon: "layout-grid",
  },
  {
    label: "Documents",
    href: "/viewer",
    icon: "folder-kanban",
    badge: "MVP",
  },
  {
    label: "Viewer",
    href: "/viewer",
    icon: "file-text",
  },
];

export const workspaceTabs: WorkspaceRoute[] = [
  {
    label: "Search",
    href: "/viewer",
    icon: "search",
  },
  {
    label: "Review inbox",
    href: "/viewer",
    icon: "bell",
  },
  {
    label: "Team workspace",
    href: "/viewer",
    icon: "users",
    badge: "Pro",
  },
];

export const secondaryNavigation: WorkspaceRoute[] = [
  {
    label: "Team",
    href: "/viewer",
    icon: "users",
  },
  {
    label: "Settings",
    href: "/viewer",
    icon: "settings",
  },
];
