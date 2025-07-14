import type { NextConfig } from "next";

const developmentCSP = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com localhost:* 127.0.0.1:* *.localhost:* http://localhost:* https://www.gstatic.com;
  style-src 'self' 'unsafe-inline' localhost:* 127.0.0.1:* *.localhost:*;
  img-src 'self' blob: data: localhost:* 127.0.0.1:* *.localhost:* https://lh3.googleusercontent.com;
  font-src 'self' localhost:* 127.0.0.1:* *.localhost:*;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self';
  connect-src 'self'
    localhost 127.0.0.1 *.localhost
    ws://localhost ws://127.0.0.1 
    wss://localhost wss://127.0.0.1
    https://securetoken.googleapis.com
    https://identitytoolkit.googleapis.com
    https://firestore.googleapis.com;
  worker-src 'self' blob:;
  child-src 'self' blob: https://*.firebaseapp.com https://*.google.com https://*.gstatic.com;
  manifest-src 'self';
  media-src 'self' blob: data: localhost:* 127.0.0.1:* *.localhost:*;
`;

const productionCSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https://*.vercel.app https://your-domain.com;
  font-src 'self' https://fonts.gstatic.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  connect-src 'self'
    localhost:* 127.0.0.1:* *.localhost:* 
    https://*.vercel.app
    https://vitals.vercel-insights.com
    https://your-api.com
    https://*.googleapis.com
    https://*.firebaseio.com
    https://firestore.googleapis.com
    https://*.firebaseapp.com
    https://securetoken.googleapis.com
    https://identitytoolkit.googleapis.com;
  worker-src 'self' blob:;
  child-src 'self';
  manifest-src 'self';
  media-src 'self' blob: data:;
  upgrade-insecure-requests;
`;

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
    reactRemoveProperties: process.env.NODE_ENV === "production",
  },

  experimental: {
    optimizePackageImports: [
      "firebase/firestore",
      "firebase/auth",
      "firebase/storage",
      "firebase/analytics",
      "firebase/functions",
      "@mui/material",
      "@mui/icons-material",
      "@emotion/react",
      "@emotion/styled",
      "emoji-mart",
      "@emoji-mart/data",
      "@emoji-mart/react",
      "react-firebase-hooks",
      "lodash",
      "date-fns",
    ],
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  async headers() {
    const isDev = process.env.NODE_ENV === "development";

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: (isDev ? developmentCSP : productionCSP)
              .replace(/\s{2,}/g, " ")
              .trim(),
          },
          {
            key: "Strict-Transport-Security",
            value: isDev
              ? "max-age=0"
              : "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: isDev ? "SAMEORIGIN" : "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Cross-Origin-Opener-Policy",
            value: isDev ? "unsafe-none" : "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: isDev ? "cross-origin" : "same-origin",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*\\.(?:jpg|jpeg|png|gif|webp|avif|ico|svg)$)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=2592000",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [];
  },

  async rewrites() {
    return [];
  },
};

export default nextConfig;
