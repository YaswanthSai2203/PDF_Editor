export type AppNavigationItem = {
  title: string;
  href: string;
  description: string;
  disabled?: boolean;
};

export const appConfig: { name: string; navigation: AppNavigationItem[] } = {
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
};
