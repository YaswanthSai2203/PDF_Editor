import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDir, "..");
const sourceWorkerPath = resolve(
  projectRoot,
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
);
const targetWorkerPath = resolve(projectRoot, "public/pdf.worker.min.mjs");

async function copyPdfWorker() {
  try {
    await mkdir(dirname(targetWorkerPath), { recursive: true });
    await copyFile(sourceWorkerPath, targetWorkerPath);
    console.log("pdf.worker.min.mjs copied to /public");
  } catch (error) {
    console.error("Failed to copy PDF.js worker file.", error);
    process.exitCode = 1;
  }
}

void copyPdfWorker();
