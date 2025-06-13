import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-13 12:53:21";
const CURRENT_USER = "Sdiabate1337";

// List of paths that should be publicly accessible (PWA assets)
const PUBLIC_PATHS = [
  '/icons/',
  '/screenshots/',
  '/manifest.json',
  '/sw.js',
  '/favicon.ico',
  '/workbox-',
  '/_next/image',
  '/_next/static'
];

// Define protected paths
const PROTECTED_PATHS = [
  '/dashboard',
  '/profile',
  '/settings',
];

// Define admin-only paths
const ADMIN_PATHS = [
  '/admin',
];

// Authentication paths
const AUTH_PATHS = [
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public access to PWA assets
  for (const publicPath of PUBLIC_PATHS) {
    if (pathname.startsWith(publicPath)) {
      console.log(`[${CURRENT_TIMESTAMP}] [${CURRENT_USER}] Allowing public access to: ${pathname}`);
      return NextResponse.next();
    }
  }
  
  // Skip middleware for API routes to prevent conflicts
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Simplify token extraction
  const accessToken = request.cookies.get('accessToken')?.value;
  
  // If user is already logged in and trying to access auth pages, redirect to dashboard
  if (AUTH_PATHS.some(path => pathname.startsWith(path)) && accessToken) {
    console.log(`[${CURRENT_TIMESTAMP}] Redirecting authenticated user from ${pathname} to dashboard`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Skip middleware for non-protected paths
  if (!PROTECTED_PATHS.some(path => pathname.startsWith(path)) && 
      !ADMIN_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // For now, just let the page handle token verification
  // This avoids Edge Runtime compatibility issues
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Authentication pages
    '/login',
    '/register',
    '/verify-email',
    '/forgot-password',
    '/reset-password',
    
    // Protected paths
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/admin/:path*',
    
    // Include all paths but explicitly exclude public assets
    // This ensures the middleware runs for all routes so we can check PUBLIC_PATHS
    '/((?!_next/static|_next/image|favicon.ico|icons/|screenshots/|manifest.json|sw.js|workbox-).*)'
  ]
};