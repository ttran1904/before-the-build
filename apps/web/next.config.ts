import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@before-the-build/shared", "frappe-gantt"],
};

export default nextConfig;
