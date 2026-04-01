import { getViewerDocument } from "@/features/pdf-viewer/application/get-viewer-document";
import { PdfViewerWorkspace } from "@/features/pdf-viewer/presentation/pdf-viewer-workspace";

export default async function ViewerPage() {
  const document = await getViewerDocument();

  return <PdfViewerWorkspace document={document} />;
}
