import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.186.96.40', '10.208.207.40', '10.99.167.40', '192.168.1.10', '10.183.120.72', '192.168.1.16', '192.168.1.6', '192.168.1.21'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_BASE_URL 
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/:path*`
          : 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
