import { redirect } from "next/navigation";

/**
 * Root "/" redirects to the dashboard.
 * When auth is wired up, unauthenticated users will be redirected to /login instead.
 */
export default function RootPage() {
  redirect("/");
}
