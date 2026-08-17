import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    // Compare existed for the old multi-app admin. Send bookmarks to Reports.
    return [{ source: "/compare", destination: "/reports", permanent: true }];
  },
};

export default nextConfig;
