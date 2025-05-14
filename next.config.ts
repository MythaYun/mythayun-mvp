import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add this experimental section for Server Actions
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'studious-zebra-x5xqvvw5rwg53w7g-3000.app.github.dev',
        '.app.github.dev'
      ],
    },
  },
};

export default nextConfig;