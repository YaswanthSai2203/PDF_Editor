import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PdfViewer } from "@/features/pdf-viewer/components/pdf-viewer";
import { resolveViewerSourceUrl } from "@/features/pdf-viewer/lib/resolve-viewer-source-url";

interface AnnotatePageProps {
  searchParams: Promise<{
    src?: string;
    docId?: string;
  }>;
}

export default async function AnnotatePage({ searchParams }: AnnotatePageProps) {
  const sourceUrl = await resolveViewerSourceUrl(searchParams);

  return (
    <div className="h-full p-4 md:p-6">
      <Card className="h-full">
        <CardHeader className="border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <CardTitle className="text-base md:text-lg">Annotate</CardTitle>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Highlights and notes on: <span className="font-mono">{sourceUrl}</span>
          </p>
        </CardHeader>

        <CardContent className="h-[calc(100%-84px)] p-0">
          <PdfViewer sourceUrl={sourceUrl} initialMode="annotate" />
        </CardContent>
      </Card>
    </div>
  );
}
