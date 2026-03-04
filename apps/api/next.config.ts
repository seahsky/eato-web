import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

// Suppress stale data warning from baseline-browser-mapping (upstream issue, latest version still has old data)
process.env.BROWSERSLIST_IGNORE_OLD_DATA = "true";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.openfoodfacts.org",
      },
      {
        protocol: "https",
        hostname: "world.openfoodfacts.org",
      },
    ],
  },
};

export default withSerwist(nextConfig);
