import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Standalone build copies only the pruned node_modules the app needs — what Dockerfile runs.
  output: "standalone",
};

export default nextConfig;
