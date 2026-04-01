import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

// TODO: replace with real auth session
const MOCK_USER = {
  name: "Alex Johnson",
  email: "alex@example.com",
  image: null,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader user={MOCK_USER} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
