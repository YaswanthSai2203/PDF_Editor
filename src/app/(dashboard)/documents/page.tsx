import { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Upload,
  Grid3x3,
  List,
  Filter,
  SortDesc,
  MoreHorizontal,
  Eye,
  Download,
  Trash2,
  Pencil,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatBytes, formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Documents",
};

const mockDocuments = [
  { id: "doc_1", title: "Q1 2026 Financial Report.pdf", fileSize: 2_450_000, pageCount: 24, updatedAt: new Date(Date.now() - 1000 * 60 * 30), status: "READY" },
  { id: "doc_2", title: "Service Agreement — Acme Corp.pdf", fileSize: 890_000, pageCount: 8, updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3), status: "READY" },
  { id: "doc_3", title: "Employee Handbook v2.pdf", fileSize: 5_200_000, pageCount: 62, updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), status: "READY" },
  { id: "doc_4", title: "Invoice #1042 — March 2026.pdf", fileSize: 340_000, pageCount: 2, updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48), status: "READY" },
  { id: "doc_5", title: "Board Resolution — Apr 2026.pdf", fileSize: 120_000, pageCount: 4, updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72), status: "READY" },
  { id: "doc_6", title: "Architecture Proposal v3.pdf", fileSize: 8_900_000, pageCount: 47, updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 96), status: "PROCESSING" },
];

export default function DocumentsPage() {
  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {mockDocuments.length} documents · 1.4 GB used of 10 GB
          </p>
        </div>
        <Button size="sm">
          <Upload className="h-3.5 w-3.5" />
          Upload PDF
        </Button>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Search documents..."
          className="h-8 w-60"
        />
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <SortDesc className="h-3.5 w-3.5" />
          Sort
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" className="h-8 w-8">
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Document table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Name</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs hidden md:table-cell">Pages</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs hidden md:table-cell">Size</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs hidden lg:table-cell">Modified</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
              <th className="px-4 py-2.5 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockDocuments.map((doc) => (
              <tr
                key={doc.id}
                className="hover:bg-accent/30 transition-colors group"
              >
                <td className="px-4 py-2.5">
                  <Link
                    href={`/editor/${doc.id}`}
                    className="flex items-center gap-3 hover:text-primary transition-colors"
                  >
                    <div className="flex h-8 w-7 items-center justify-center rounded border border-border bg-muted shrink-0">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="font-medium truncate max-w-[200px] sm:max-w-xs">
                      {doc.title}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">
                  {doc.pageCount}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">
                  {formatBytes(doc.fileSize)}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground hidden lg:table-cell">
                  {formatRelativeTime(doc.updatedAt)}
                </td>
                <td className="px-4 py-2.5">
                  <Badge
                    variant={doc.status === "READY" ? "success" : "warning"}
                    className="text-[10px]"
                  >
                    {doc.status === "PROCESSING" ? "Processing" : "Ready"}
                  </Badge>
                </td>
                <td className="px-4 py-2.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild>
                        <Link href={`/editor/${doc.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                          Open editor
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pencil className="h-3.5 w-3.5" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="h-3.5 w-3.5" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
