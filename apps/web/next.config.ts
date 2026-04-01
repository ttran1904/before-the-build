import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@before-the-build/shared", "frappe-gantt"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
