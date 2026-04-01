import { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Upload,
  Clock,
  FileSignature,
  TrendingUp,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBytes, formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Mock data — will be replaced by server actions / API calls
const recentDocuments = [
  {
    id: "doc_1",
    title: "Q1 2026 Financial Report.pdf",
    fileSize: 2_450_000,
    pageCount: 24,
    updatedAt: new Date(Date.now() - 1000 * 60 * 30),
    status: "READY" as const,
    thumbnailUrl: null,
  },
  {
    id: "doc_2",
    title: "Service Agreement — Acme Corp.pdf",
    fileSize: 890_000,
    pageCount: 8,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    status: "READY" as const,
    thumbnailUrl: null,
  },
  {
    id: "doc_3",
    title: "Employee Handbook v2.pdf",
    fileSize: 5_200_000,
    pageCount: 62,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: "READY" as const,
    thumbnailUrl: null,
  },
  {
    id: "doc_4",
    title: "Invoice #1042 — March 2026.pdf",
    fileSize: 340_000,
    pageCount: 2,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    status: "READY" as const,
    thumbnailUrl: null,
  },
];

const stats = [
  { label: "Total Documents", value: "42", icon: FileText, delta: "+4 this week" },
  { label: "Pending Signatures", value: "3", icon: FileSignature, delta: "2 overdue" },
  { label: "Storage Used", value: "1.4 GB", icon: TrendingUp, delta: "of 10 GB" },
  { label: "Recent Activity", value: "12", icon: Clock, delta: "actions today" },
];

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, Alex. Here&apos;s what&apos;s happening.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/documents">
              View all documents
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button size="sm">
            <Plus className="h-3.5 w-3.5" />
            Upload PDF
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-lg border border-border p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-semibold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.delta}</p>
          </div>
        ))}
      </div>

      {/* Recent documents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Recent Documents</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/documents">
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {recentDocuments.map((doc) => (
            <Link
              key={doc.id}
              href={`/editor/${doc.id}`}
              className="group flex items-center gap-4 p-3 bg-card rounded-lg border border-border hover:border-primary/50 hover:bg-accent/30 transition-colors"
            >
              {/* File icon / thumbnail */}
              <div className="flex h-10 w-8 items-center justify-center rounded border border-border bg-muted shrink-0">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {doc.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {doc.pageCount} pages · {formatBytes(doc.fileSize)} · edited{" "}
                  {formatRelativeTime(doc.updatedAt)}
                </p>
              </div>

              {/* Status / actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="success" className="text-[10px]">
                  Ready
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Upload & Edit PDF", icon: Upload, href: "/documents?upload=1", color: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400" },
            { label: "Request Signature", icon: FileSignature, href: "/signatures/new", color: "text-violet-600 bg-violet-50 dark:bg-violet-950 dark:text-violet-400" },
            { label: "Create Form", icon: FileText, href: "/forms/new", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400" },
            { label: "Recent Activity", icon: Clock, href: "/activity", color: "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2.5 p-4 bg-card rounded-lg border border-border hover:border-primary/50 hover:bg-accent/30 transition-colors text-center group"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
