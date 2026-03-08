import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Allow images from R2 / Cloudflare CDN and placeholder
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "**.cloudflare.com",
      },
    ],
  },

  // Proxy API calls to backend during development (avoid CORS)
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
