import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // ⚠️ Vercel Build: Ignore TypeScript errors
    ignoreBuildErrors: true,
  },
  /* config options here */
};

export default nextConfig;
