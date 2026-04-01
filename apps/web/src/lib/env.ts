import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_PDF_WORKER_PATH: z.string().default("/pdf.worker.min.mjs"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_PDF_WORKER_PATH: process.env.NEXT_PUBLIC_PDF_WORKER_PATH,
});
