import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
