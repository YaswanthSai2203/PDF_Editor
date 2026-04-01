import { env } from "@/lib/env";
import type { ViewerDocument } from "@/features/pdf-viewer/domain/pdf-document";

const FALLBACK_SAMPLE_DOCUMENT: ViewerDocument = {
  id: "sample-contract",
  name: "Commercial Lease Agreement",
  source: {
    kind: "url",
    url: env.NEXT_PUBLIC_DEMO_PDF_URL,
  },
  pageCount: 14,
  byteSize: 1016315,
  ownerName: "Product Demo Workspace",
  updatedAt: "2026-04-01T00:00:00.000Z",
  tags: ["mvp", "viewer", "demo"],
  versionLabel: "v1.0",
  category: "Legal agreement",
  accessLevel: "Editor",
  storageProvider: "Object storage",
};

export async function getViewerDocument(): Promise<ViewerDocument> {
  return FALLBACK_SAMPLE_DOCUMENT;
}
