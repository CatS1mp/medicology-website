import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
