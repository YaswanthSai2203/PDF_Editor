// Prisma 7 uses a new client API pattern.
// Import the generated client from the default location.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");

type PrismaClientType = InstanceType<typeof PrismaClient>;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClientType | undefined;
}

function createPrismaClient(): PrismaClientType {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

// Singleton pattern: reuse client across hot-reloads in development
export const db: PrismaClientType =
  globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}
