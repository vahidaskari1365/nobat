import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* Ship the seeded SQLite demo DB inside every serverless bundle (needed on Vercel) */
  outputFileTracingIncludes: {
    "/**": ["./db/custom.db"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  /* Security headers — SSL/TLS hardening (HSTS requires HTTPS) */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self)" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
