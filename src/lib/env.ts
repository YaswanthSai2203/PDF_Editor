import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_DEMO_PDF_URL: z
    .string()
    .url()
    .default("https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_DEMO_PDF_URL: process.env.NEXT_PUBLIC_DEMO_PDF_URL,
});
