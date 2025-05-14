import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Existing config...
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'studious-zebra-x5xqvvw5rwg53w7g-3000.app.github.dev',
        '.app.github.dev',
        '.vercel.app',
        'mythayun-mvp-staging.vercel.app',
        '*.vercel.app'
      ],
    },
    // suppressHydrationWarnings is not a valid option in experimental config and has been removed
  },
};

export default nextConfig;