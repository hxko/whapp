import type { NextConfig } from "next";

const developmentCSP = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' localhost:* 127.0.0.1:* *.localhost:*;
  style-src 'self' 'unsafe-inline' localhost:* 127.0.0.1:* *.localhost:*;
  img-src 'self' blob: data: localhost:* 127.0.0.1:* *.localhost:*;
  font-src 'self' localhost:* 127.0.0.1:* *.localhost:*;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self';
  connect-src 'self' localhost:* 127.0.0.1:* *.localhost:* ws://localhost:* ws://127.0.0.1:* wss://localhost:* wss://127.0.0.1:*;
  worker-src 'self' blob:;
  child-src 'self' blob:;
  manifest-src 'self';
  media-src 'self' blob: data: localhost:* 127.0.0.1:* *.localhost:*;
`;

const productionCSP = `
  default-src 'self';
  script-src 'self' 'strict-dynamic' 'sha256-YOUR_SCRIPT_HASH_HERE' https://www.gstatic.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https://*.vercel.app https://your-domain.com;
  font-src 'self' https://fonts.gstatic.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  connect-src 'self' https://*.vercel.app https://vitals.vercel-insights.com https://your-api.com https://*.googleapis.com https://*.firebaseio.com https://firestore.googleapis.com;
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

  webpack: (config, { dev, isServer }) => {
    // Your existing webpack configuration
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          minSize: 20000,
          maxSize: 100000,
          cacheGroups: {
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: "react",
              priority: 40,
              reuseExistingChunk: true,
            },
            firebase: {
              test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
              name: "firebase",
              priority: 35,
              chunks: "async",
              reuseExistingChunk: true,
            },
            muiCore: {
              test: /[\\/]node_modules[\\/]@mui[\\/]/,
              name: "mui-core",
              priority: 30,
              chunks: "async",
              reuseExistingChunk: true,
            },
            muiIcons: {
              test: /[\\/]node_modules[\\/]@mui[\\/]/,
              name: "mui-icons",
              priority: 29,
              chunks: "async",
              reuseExistingChunk: true,
            },
            emotion: {
              test: /[\\/]node_modules[\\/]@emotion[\\/]/,
              name: "emotion",
              priority: 28,
              chunks: "async",
              reuseExistingChunk: true,
            },
            emoji: {
              test: /[\\/]node_modules[\\/](emoji-mart|@emoji-mart)[\\/]/,
              name: "emoji",
              priority: 25,
              chunks: "async",
              reuseExistingChunk: true,
            },
            vendorLarge: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendor-large",
              priority: 20,
              chunks: "async",
              minSize: 50000,
              reuseExistingChunk: true,
            },
            vendorSmall: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendor-small",
              priority: 15,
              chunks: "all",
              maxSize: 50000,
              reuseExistingChunk: true,
            },
          },
        },
        usedExports: true,
        sideEffects: false,
      };
    }

    if (dev) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }

    if (process.env.ANALYZE === "true" && !isServer) {
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
      config.plugins?.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "static",
          openAnalyzer: false,
          reportFilename: "bundle-analyzer.html",
        })
      );
    }

    return config;
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
