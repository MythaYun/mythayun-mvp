import { NextRequest, NextResponse } from 'next/server';
import { handleGoogleCallback } from '@/lib/auth/social-auth';

export async function GET(request: NextRequest) {
  try {
    // Extract authorization code and errors from URL
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Processing Google callback`, { hasCode: !!code, error: error || 'none' });
    
    // FIXED: Consistent base URL determination across all code paths
    // This should match exactly what's in your social-auth.js getGoogleOAuthURL function
    const baseUrl = process.env.VERCEL_ENV === 'production'
      ? 'https://mythayun-staging.vercel.app'
      : process.env.CODESPACE_NAME 
        ? `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Log the base URL to help with debugging
    console.log(`[${timestamp}] Using base URL: ${baseUrl}`);
    
    // FIXED: Consistent error parameter handling
    if (error || !code) {
      const errorReason = error || 'missing_code';
      console.error(`[${timestamp}] Google OAuth error: ${errorReason}`);
      return NextResponse.redirect(`${baseUrl}/?auth_error=${encodeURIComponent(errorReason)}`);
    }
    
    // Process the callback and get the JWT token
    const { token, newUser } = await handleGoogleCallback(code);
    
    if (!token) {
      console.error(`[${timestamp}] Google authentication failure: Token not generated`);
      return NextResponse.redirect(`${baseUrl}/?auth_error=token_generation_failed`);
    }
    
    // Create cookie options for JWT token
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    };
    
    // Create response with redirect to dashboard
    const response = NextResponse.redirect(`${baseUrl}/dashboard${newUser ? '?new_user=true' : ''}`);
    
    // Set JWT token cookie
    response.cookies.set('accessToken', token, cookieOptions);
    
    console.log(`[${timestamp}] Google authentication successful, redirecting to dashboard`);
    
    return response;
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Google callback error:`, error);
    
    // FIXED: Use same base URL determination as success path
    const baseUrl = process.env.VERCEL_ENV === 'production'
      ? 'https://mythayun-staging.vercel.app'
      : process.env.CODESPACE_NAME 
        ? `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // FIXED: Consistent error parameter naming
    const errorMessage = error instanceof Error ? error.message : 'unknown_error';
    return NextResponse.redirect(`${baseUrl}/?auth_error=${encodeURIComponent(errorMessage)}`);
  }
}