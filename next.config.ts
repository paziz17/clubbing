import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /** מונע בחירה שגויה של שורש (למשל בגלל pnpm-lock.yaml מחוץ לפרויקט) */
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
