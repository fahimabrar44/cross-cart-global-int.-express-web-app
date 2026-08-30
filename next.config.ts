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
          // --- Security headers ---
          // HSTS: HTTPS-only site (Vercel). No includeSubDomains/preload to
          // avoid affecting any HTTP-only subdomain before it is verified.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
          // Content-Security-Policy allowing the third-party scripts actually
          // used (GTM, GA4, Clarity, GTM/GA + consent), plus same-origin. Kept
          // functional (unsafe-inline/unsafe-eval) to avoid breaking hydration,
          // inline analytics bootsrap, and GTM container scripts.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://www.clarity.ms https://clarity.ms https://connect.facebook.net https://analytics.tiktok.com https://snap.licdn.com https://s.pinimg.com https://static.ads-twitter.com https://va.vercel-scripts.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://www.googletagmanager.com https://www.google-analytics.com https://www.facebook.com https://*.cdninstagram.com https://*.clarity.ms https://va.vercel-scripts.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://*.clarity.ms https://clarity.ms https://*.google-analytics.com https://analytics.tiktok.com https://s.pinimg.com https://*.linkedin.com https://static.ads-twitter.com https://va.vercel-scripts.com https://cloudflareinsights.com",
              "frame-src 'self' https://www.googletagmanager.com https://www.google.com https://www.youtube.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "worker-src 'self' blob:",
            ].join('; '),
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-site',
          },
          // --- Caching ---
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
