import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Middleware already redirects unauthenticated requests, but double-check
  // here in case middleware is bypassed (e.g. direct server access).
  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader user={user} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
