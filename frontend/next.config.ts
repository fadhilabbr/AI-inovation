import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['172.16.2.222'],
  async rewrites() {
    return [
      {
        source: '/api/v1/dashboard/:path*',
        destination: 'https://ai-inovation-production-7362.up.railway.app/api/v1/analytics/:path*',
      },
    ];
  },
};

export default nextConfig;
