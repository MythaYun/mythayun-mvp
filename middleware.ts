import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth/jwt';

// List of protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/favorites',
];

// List of auth routes (redirect authenticated users away from these)
const authRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

/**
 * Middleware to protect routes and handle authentication
 */
export function middleware(request: NextRequest) {
  // Get token from cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  
  const { pathname } = request.nextUrl;
  
  // Check if the route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Check if it's an auth route
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // If trying to access protected route without token, redirect to login
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (isAuthRoute && accessToken) {
    // Verify token validity
    const decodedToken = verifyToken(accessToken);
    if (decodedToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // If token is invalid, proceed to auth route
  }
  
  // For all other requests, continue
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (e.g. robots.txt)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|.*\\.png$).*)',
  ],
};