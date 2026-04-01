import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin images (for PDF thumbnails and user avatars)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  // Required for PDF.js worker to be served correctly
  async headers() {
    return [
      {
        source: "/pdf.worker.min.mjs",
        headers: [
          { key: "Content-Type", value: "application/javascript" },
        ],
      },
    ];
  },

  // Turbopack config (Next.js 16 default bundler)
  turbopack: {
    resolveAlias: {
      canvas: "./src/lib/empty-module.ts",
    },
  },

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tooltip",
    ],
  },
};

export default nextConfig;
