import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

// Next.js 16 renamed "middleware" to "proxy".
// Edge-compatible auth guard using the lightweight authConfig (no Prisma, no bcrypt).
const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf\\.worker\\.min\\.mjs)).*)",
  ],
};
