import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for React 19
  experimental: {
    ppr: false,
  },
  // Configure for Replit environment
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  // Allow all hosts for Replit proxy
  async rewrites() {
    return [];
  },
  async headers() {
    return [
      // Public pages: cacheable with stale-while-revalidate so crawlers/visitors
      // get fast responses while content still refreshes (SSR stays dynamic).
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
          },
        ],
      },
      // Private/admin surfaces must never be cached.
      {
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/auth/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
