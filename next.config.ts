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

  // Proxy API calls to backend (exclude /api/auth which is handled by NextAuth)
  async rewrites() {
    return [
      {
        source: "/api/:path((?!auth).*)",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/:path`,
      },
    ];
  },
};

export default nextConfig;
