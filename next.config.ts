/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Remove any experimental features that might cause issues
  experimental: {
    // Keep only what's absolutely necessary
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '.vercel.app',
        'mythayun-staging.vercel.app',
      ],
    },
  },
  // Prevent any Pages Router behavior
  useFileSystemPublicRoutes: true,
};

module.exports = nextConfig;