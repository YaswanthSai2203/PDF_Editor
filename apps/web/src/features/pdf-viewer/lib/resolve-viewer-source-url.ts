export const DEFAULT_VIEWER_PDF_URL =
  "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";

type ViewerSearchParams = {
  src?: string;
  docId?: string;
};

export async function resolveViewerSourceUrl(
  searchParams: Promise<ViewerSearchParams>,
): Promise<string> {
  const resolvedSearchParams = await searchParams;
  const rawSourceUrl =
    resolvedSearchParams.src && resolvedSearchParams.src.trim()
      ? resolvedSearchParams.src
      : DEFAULT_VIEWER_PDF_URL;
  const docId = resolvedSearchParams.docId?.trim();
  return docId
    ? `${rawSourceUrl}${rawSourceUrl.includes("?") ? "&" : "?"}docId=${encodeURIComponent(docId)}`
    : rawSourceUrl;
}
