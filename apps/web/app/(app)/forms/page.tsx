import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PdfViewer } from "@/features/pdf-viewer/components/pdf-viewer";
import { resolveViewerSourceUrl } from "@/features/pdf-viewer/lib/resolve-viewer-source-url";

interface FormsPageProps {
  searchParams: Promise<{
    src?: string;
    docId?: string;
  }>;
}

export default async function FormsPage({ searchParams }: FormsPageProps) {
  const sourceUrl = await resolveViewerSourceUrl(searchParams);

  return (
    <div className="h-full p-4 md:p-6">
      <Card className="h-full">
        <CardHeader className="border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <CardTitle className="text-base md:text-lg">Forms</CardTitle>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Source: <span className="font-mono">{sourceUrl}</span>
          </p>
        </CardHeader>

        <CardContent className="h-[calc(100%-84px)] p-0">
          <PdfViewer sourceUrl={sourceUrl} initialPanel="forms" />
        </CardContent>
      </Card>
    </div>
  );
}
