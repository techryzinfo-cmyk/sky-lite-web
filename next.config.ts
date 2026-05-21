import type { NextConfig } from "next";

const allowedDevOrigins = [
  "192.168.1.21",
  ...(process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",").map((s) => s.trim())
    : [])
];

const nextConfig: NextConfig = {
  allowedDevOrigins,
  async rewrites() {
    const apiProxyUrl = process.env.API_URL;
    if (!apiProxyUrl) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
