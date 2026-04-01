import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PdfViewer } from "@/features/pdf-viewer/components/pdf-viewer";

const defaultPdfUrl =
  "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";

interface ViewerPageProps {
  searchParams: Promise<{
    src?: string;
    docId?: string;
  }>;
}

export default async function ViewerPage({ searchParams }: ViewerPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawSourceUrl =
    resolvedSearchParams.src && resolvedSearchParams.src.trim()
      ? resolvedSearchParams.src
      : defaultPdfUrl;
  const docId = resolvedSearchParams.docId?.trim();
  const sourceUrl = docId
    ? `${rawSourceUrl}${rawSourceUrl.includes("?") ? "&" : "?"}docId=${encodeURIComponent(docId)}`
    : rawSourceUrl;

  return (
    <div className="h-full p-4 md:p-6">
      <Card className="h-full">
        <CardHeader className="border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <CardTitle className="text-base md:text-lg">PDF Viewer</CardTitle>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Source: <span className="font-mono">{sourceUrl}</span>
          </p>
        </CardHeader>

        <CardContent className="h-[calc(100%-84px)] p-0">
          <PdfViewer sourceUrl={sourceUrl} />
        </CardContent>
      </Card>
    </div>
  );
}
