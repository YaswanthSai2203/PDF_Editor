import { Metadata } from "next";
import { EditorClient } from "./editor-client";

interface EditorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditorPageProps): Promise<Metadata> {
  const { id } = await params;
  // TODO: fetch real document title from DB
  return {
    title: `Edit Document — ${id}`,
  };
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { id } = await params;

  // TODO: fetch document from DB, check permissions, get signed S3 URL
  // For now use a public demo PDF
  const mockDocument = {
    id,
    title: "Q1 2026 Financial Report.pdf",
    // Using Mozilla's PDF.js test file as demo
    url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
    userId: "user_demo",
  };

  return <EditorClient document={mockDocument} />;
}
