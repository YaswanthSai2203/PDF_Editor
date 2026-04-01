/**
 * Prisma 7 client — uses the pg driver adapter pattern required by Prisma 7.
 *
 * In production: DATABASE_URL must be set.
 * In CI / build: the client is created but not actually connected.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type PrismaClientType = PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClientType | undefined;
}

function createPrismaClient(): PrismaClientType {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    // During build / static generation without a real DB,
    // return a stub client that will fail at runtime (not at build time).
    // This is acceptable because SSG pages don't hit the DB.
    return new PrismaClient({
      // @ts-expect-error adapter required in Prisma 7 but we stub it here
      adapter: null,
    });
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const db: PrismaClientType =
  globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}
