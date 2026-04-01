import "dotenv/config";

import { defineConfig } from "prisma/config";

const fallbackLocalDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/pdf_editor";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? fallbackLocalDatabaseUrl,
  },
});
