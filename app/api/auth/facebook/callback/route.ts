import { NextRequest, NextResponse } from 'next/server';
import { handleFacebookCallback } from '@/lib/auth/social-auth';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-14 04:37:12";

export async function GET(request: NextRequest) {
  try {
    // Extract authorization code from URL
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorReason = searchParams.get('error_reason');
    const errorDescription = searchParams.get('error_description');
    
    console.log(`[${CURRENT_TIMESTAMP}] Processing Facebook callback. Code exists: ${!!code}, Error: ${error || 'none'}`);
    
    // Base URL for redirections
    const baseUrl = process.env.CODESPACE_NAME 
      ? `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Check if there's an error or if code is missing
    if (error || !code) {
      const errorMsg = errorDescription || errorReason || error || 'Missing authorization code';
      console.error(`[${CURRENT_TIMESTAMP}] Facebook OAuth error: ${errorMsg}`);
      
      // Redirect to login page with error
      return NextResponse.redirect(`${baseUrl}/?error=facebook_auth_failed&reason=${encodeURIComponent(errorMsg)}`);
    }
    
    // Process the callback and get the JWT token
    const { token, newUser } = await handleFacebookCallback(code);
    
    if (!token) {
      console.error(`[${CURRENT_TIMESTAMP}] Facebook authentication failure: Token not generated`);
      return NextResponse.redirect(`${baseUrl}/?error=facebook_auth_failed&reason=token_generation_failed`);
    }
    
    // Create cookie options for JWT token
   const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: process.env.CODESPACE_NAME ? 'none' as const : 'lax' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/'
};

    
    // Redirect to dashboard
    const dashboardUrl = new URL('/dashboard', baseUrl);
    dashboardUrl.searchParams.set('provider', 'facebook');
    
    if (newUser) {
      dashboardUrl.searchParams.set('new_user', 'true');
    }
    
    // Create response with redirect and set cookies
    const response = NextResponse.redirect(dashboardUrl);
    
    // Set cookies
    response.cookies.set('accessToken', token, cookieOptions);
    
    const refreshTokenOptions = {
      ...cookieOptions,
      maxAge: 90 * 24 * 60 * 60, // 90 days
    };
    response.cookies.set('refreshToken', token, refreshTokenOptions);
    
    console.log(`[${CURRENT_TIMESTAMP}] Facebook authentication successful, redirecting to dashboard`);
    
    return response;
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error in Facebook callback:`, error);
    
    const baseUrl = process.env.CODESPACE_NAME 
      ? `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Get meaningful error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.redirect(`${baseUrl}/?error=facebook_auth_failed&reason=${encodeURIComponent(errorMessage)}`);
  }
}