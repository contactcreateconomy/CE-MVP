import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** One physical copy of Convex + Convex Auth so `ConvexAuthProvider` and `useConvexAuth()` share React context (see @cemvp/auth-ui transpile). */
const convexPkg = path.resolve(__dirname, "node_modules/convex");
const convexAuthPkg = path.resolve(__dirname, "node_modules/@convex-dev/auth");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cemvp/auth-ui"],
  turbopack: {
    resolveAlias: {
      convex: convexPkg,
      "@convex-dev/auth": convexAuthPkg,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      convex: convexPkg,
      "@convex-dev/auth": convexAuthPkg,
    };
    return config;
  },
  async redirects() {
    return [
      /** Prefer config redirect over RSC `redirect()` so `/` does not depend on the app-page pipeline (fewer stale-`.next` dev failures). */
      { source: "/", destination: "/feed", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/(terms|privacy)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/discussions/mvp",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
      },
      {
        protocol: "https",
        hostname: "graph.facebook.com",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
      },
    ],
  },
};

export default nextConfig;
