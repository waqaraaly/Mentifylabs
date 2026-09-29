import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Verification documents can be up to 10 MB (checked again in the upload action); the rest is multipart overhead.
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;

// Gives `next dev` the same Cloudflare bindings (the D1 database) as production, backed by local files in .wrangler/.
initOpenNextCloudflareForDev();
