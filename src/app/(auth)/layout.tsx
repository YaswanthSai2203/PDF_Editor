import { FileText } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left branding panel (hidden on mobile) */}
      <div className="hidden lg:flex flex-col bg-primary p-10 text-primary-foreground relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              DocFlow
            </span>
          </Link>

          {/* Headline */}
          <div className="mt-auto">
            <blockquote className="space-y-3">
              <p className="text-2xl font-medium leading-snug">
                &ldquo;DocFlow has completely replaced Adobe Acrobat for our
                team. The collaboration features are exceptional.&rdquo;
              </p>
              <footer className="text-sm text-primary-foreground/70">
                <strong className="text-primary-foreground">Sarah Chen</strong>
                {" "}— Head of Legal, TechCorp Inc.
              </footer>
            </blockquote>
          </div>
        </div>
      </div>

      {/* Right auth form panel */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link
            href="/"
            className="flex items-center gap-2 mb-8 lg:hidden w-fit"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">DocFlow</span>
          </Link>

          {children}
        </div>
      </div>
    </div>
  );
}
