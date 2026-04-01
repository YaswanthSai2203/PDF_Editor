export type AppNavigationItem = {
  title: string;
  href: string;
  description: string;
  disabled?: boolean;
};

export type WorkspaceItem = {
  id: string;
  name: string;
};

export type AppConfig = {
  name: string;
  navigation: AppNavigationItem[];
  workspaces: WorkspaceItem[];
  defaultWorkspaceId: string;
};

export const appConfig: AppConfig = {
  name: "NimbusPDF",
  navigation: [
    {
      title: "Viewer",
      href: "/viewer",
      description: "Render and inspect documents",
    },
    {
      title: "Annotate",
      href: "/annotate",
      description: "Highlights, notes, and drawings",
      disabled: true,
    },
    {
      title: "Organize",
      href: "/organize",
      description: "Reorder, rotate, and extract pages",
      disabled: true,
    },
    {
      title: "Sign",
      href: "/sign",
      description: "Signature request workflows",
      disabled: true,
    },
    {
      title: "Forms",
      href: "/forms",
      description: "Build and fill PDF forms",
      disabled: true,
    },
  ],
  workspaces: [
    { id: "personal", name: "Personal Workspace" },
    { id: "design-team", name: "Design Team" },
    { id: "legal-ops", name: "Legal Ops" },
  ],
  defaultWorkspaceId: "personal",
};
