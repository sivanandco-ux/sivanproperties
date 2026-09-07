import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB, which real property photos blow past almost
      // immediately -- the create-listing form uploads several at once.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
