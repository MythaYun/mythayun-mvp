import { NextRequest, NextResponse } from 'next/server';
import { handleGoogleCallback } from '../../../../../lib/auth/social-auth';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-14 04:20:50";
const CURRENT_USER = "Sdiabate1337";

export async function GET(request: NextRequest) {
  try {
    // Extract authorization code from URL
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    console.log(`[${CURRENT_TIMESTAMP}] Processing Google callback`);
    
    // Base URL for redirections
    const baseUrl = process.env.CODESPACE_NAME 
      ? `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Check if there's an error or if code is missing
    if (error || !code) {
      console.error(`[${CURRENT_TIMESTAMP}] Google OAuth error: ${error || 'Missing code'}`);
      return NextResponse.redirect(`${baseUrl}/?error=google_auth_failed&reason=${encodeURIComponent(error || 'Missing authorization code')}`);
    }
    
    // Process the callback and get the JWT token
    const { token, newUser } = await handleGoogleCallback(code);
    
    if (!token) {
      console.error(`[${CURRENT_TIMESTAMP}] Google authentication failure: Token not generated`);
      return NextResponse.redirect(`${baseUrl}/?error=google_auth_failed&reason=token_generation_failed`);
    }
    
    // Create cookie options for JWT token
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    };
    
    // IMPORTANT CHANGE: Redirect directly to dashboard instead of homepage
    const dashboardUrl = new URL('/dashboard', baseUrl);
    
    // Add provider info as query params if needed for analytics
    dashboardUrl.searchParams.set('provider', 'google');
    
    if (newUser) {
      console.log(`[${CURRENT_TIMESTAMP}] New user created via Google OAuth`);
      dashboardUrl.searchParams.set('new_user', 'true');
    }
    
    // Create response with redirect and set cookies
    const response = NextResponse.redirect(dashboardUrl);
    
    // Set both accessToken (for consistency with AuthContext) and auth_token (previous name)
    response.cookies.set('accessToken', token, cookieOptions);
    
    // Also set a refresh token with longer expiry
    const refreshTokenOptions = {
      ...cookieOptions,
      maxAge: 90 * 24 * 60 * 60, // 90 days for refresh token
    };
    response.cookies.set('refreshToken', token, refreshTokenOptions); // In production, this would be a different token
    
    console.log(`[${CURRENT_TIMESTAMP}] Google authentication successful, redirecting to dashboard: ${dashboardUrl.toString()}`);
    
    return response;
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error processing Google callback:`, error);
    
    const baseUrl = process.env.CODESPACE_NAME 
      ? `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(`${baseUrl}/?error=google_auth_failed&reason=${encodeURIComponent(errorMessage)}`);
  }
}