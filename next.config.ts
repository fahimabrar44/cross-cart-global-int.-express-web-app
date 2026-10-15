
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for React 19
  experimental: {
    ppr: false,
  },

  // Configure for Replit environment
  assetPrefix: process.env.NODE_ENV === "production" ? undefined : "",

  // Allow Cloudinary images in next/image
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },

  // Rewrites
  async rewrites() {
    return [];
  },

  async headers() {
    return [
      // Public pages
      {
        source: "/:path*",
        headers: [
          // Security headers
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://www.clarity.ms https://clarity.ms https://connect.facebook.net https://analytics.tiktok.com https://snap.licdn.com https://s.pinimg.com https://static.ads-twitter.com https://va.vercel-scripts.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://www.googletagmanager.com https://www.google-analytics.com https://www.facebook.com https://*.cdninstagram.com https://*.clarity.ms https://va.vercel-scripts.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://*.clarity.ms https://clarity.ms https://*.google-analytics.com https://analytics.tiktok.com https://s.pinimg.com https://*.linkedin.com https://static.ads-twitter.com https://va.vercel-scripts.com https://cloudflareinsights.com https://res.cloudinary.com",
              "frame-src 'self' https://www.googletagmanager.com https://www.google.com https://www.youtube.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "worker-src 'self' blob:",
            ].join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-site",
          },

          // Public page caching
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
          },
        ],
      },

      // Dashboard must never be cached
      {
        source: "/dashboard/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },

      // Authentication must never be cached
      {
        source: "/auth/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },

      // API responses must never be cached
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
