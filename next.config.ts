/**
 * @type {import('next').NextConfig}
 * 
 * Updated configuration: 2025-06-13 01:50:30
 * Updated by: Sdiabate1337
 * 
 * Manual PWA implementation that doesn't rely on next-pwa
 */

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '.vercel.app',
        'mythayun-staging.vercel.app',
      ],
    },
  },
  useFileSystemPublicRoutes: true,
  
  // Image optimization for mobile devices
  images: {
    domains: ['localhost', 'vercel.app'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Add headers for PWA
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, must-revalidate',
        },
      ],
    },
    // Specific header for manifest.json to ensure proper content type
    {
      source: '/manifest.json',
      headers: [
        {
          key: 'Content-Type',
          value: 'application/manifest+json',
        },
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600',
        },
      ],
    },
  ],
};

module.exports = nextConfig;