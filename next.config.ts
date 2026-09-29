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

// Gives `next dev` (and `next build`'s page-data collection) the same Cloudflare bindings as the
// target deploy environment, backed by local files in .wrangler/. CLOUDFLARE_ENV is set as a build
// variable on the staging Workers Build so it resolves the env.staging block instead of the default.
initOpenNextCloudflareForDev({ environment: process.env.CLOUDFLARE_ENV });
