import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  /* The audit report PDF embeds the wordmark, read from disk at runtime by
     /api/audit/report — make sure the serverless bundle carries it. */
  outputFileTracingIncludes: {
    "/api/audit/report": ["./public/brand/wordmark-on-light.png"],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
