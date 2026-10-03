import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Baseline browser protections on every response. No CSP yet: Next's inline scripts would need a
// per-request nonce, which is worth adding once the pages are otherwise settled.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Verification and Pending approval were merged into one queue; keep old links and bookmarks working.
  async redirects() {
    return [
      { source: "/admin/verification", destination: "/admin/pending", permanent: false },
      { source: "/admin/verification/:slug", destination: "/admin/pending/:slug", permanent: false },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
