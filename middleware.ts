import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-14 03:53:13";
const CURRENT_USER = "Sdiabate1337";

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
  ]
};