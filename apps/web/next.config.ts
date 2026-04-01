import { resolve } from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Keep workspace root explicit to avoid lockfile ambiguity warnings.
    root: resolve(__dirname, "..", ".."),
  },
};

export default nextConfig;
