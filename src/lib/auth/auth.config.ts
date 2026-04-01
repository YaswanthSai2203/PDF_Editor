import type { NextAuthConfig } from "next-auth";

/**
 * Auth configuration shared between the Edge middleware and the full Node.js runtime.
 * This file must NOT import anything that depends on Node.js APIs (e.g. bcrypt, Prisma).
 *
 * Design: split config (edge-safe) from the full auth.ts (Node-only).
 * See https://authjs.dev/guides/edge-compatibility
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
    newUser: "/onboarding",
  },

  callbacks: {
    /**
     * Gate all dashboard routes behind authentication.
     * Public routes (auth pages, API webhook) are explicitly allowed.
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const publicPaths = [
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/api/auth",
        "/api/webhooks",
        "/share",
      ];

      const isPublic = publicPaths.some(
        (path) =>
          nextUrl.pathname === path ||
          nextUrl.pathname.startsWith(path + "/")
      );

      if (isPublic) return true;
      if (isLoggedIn) return true;

      // Redirect to login, preserving the original destination
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", nextUrl.href);
      return Response.redirect(loginUrl);
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  providers: [],
};
