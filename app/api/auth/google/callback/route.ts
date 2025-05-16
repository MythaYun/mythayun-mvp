import { NextRequest, NextResponse } from 'next/server';
import { handleGoogleCallback } from '@/lib/auth/social-auth';
import { JWT_ACCESS_EXPIRY_SECONDS, JWT_REFRESH_EXPIRY_SECONDS } from '@/lib/auth/jwt-types';

export async function GET(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Google OAuth callback received`);
    
    // Get the authorization code from the request
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (error) {
      console.error(`[${timestamp}] Google OAuth error: ${error}`);
      return NextResponse.redirect(`/?auth_error=google_${error}`);
    }
    
    if (!code) {
      console.error(`[${timestamp}] No authorization code provided`);
      return NextResponse.redirect('/?auth_error=No_authorization_code');
    }
    
    // Process the OAuth flow
    const { accessToken, refreshToken, newUser } = await handleGoogleCallback(code);
    
    // Get host from the request
    const host = request.headers.get('host');
    console.log(`[${timestamp}] Host from headers: ${host}`);
    
    // Use welcome=true parameter for onboarding new users
    const redirectPath = newUser ? '/dashboard?welcome=true' : '/dashboard';
    console.log(`[${timestamp}] User is ${newUser ? 'new' : 'returning'}, redirecting to ${redirectPath}`);
    
    // CRITICAL FIX: Use the correct GitHub Codespaces URL format
    if (process.env.CODESPACE_NAME) {
      // Use codespace name with -3000 suffix
      const codespaceBaseUrl = `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`;
      const absoluteUrl = `${codespaceBaseUrl}${redirectPath}`;
      
      console.log(`[${timestamp}] Using absolute URL for Codespaces: ${absoluteUrl}`);
      
      // Create a Headers object for multiple Set-Cookie headers
      const headers = new Headers();
      headers.append('Location', absoluteUrl);
      
      // Add access token cookie
      headers.append('Set-Cookie', 
        `accessToken=${accessToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${JWT_ACCESS_EXPIRY_SECONDS}`
      );
      
      // Add refresh token cookie
      headers.append('Set-Cookie',
        `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${JWT_REFRESH_EXPIRY_SECONDS}`
      );
      
      // Set auth_success flag for detecting successful login in client
      headers.append('Set-Cookie',
        `auth_success=true; Path=/; Max-Age=60`
      );
      
      // Use native Response with Headers object
      console.log(`[${timestamp}] Redirecting to: ${absoluteUrl} with cookies`);
      return new Response(null, {
        status: 302,
        headers: headers
      });
    }
    
    // For non-Codespaces environments, use the standard Next.js redirect
    const response = NextResponse.redirect(new URL(redirectPath, request.nextUrl));
    
    // Set cookie options for standard environment
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };
    
    // Set access token cookie
    response.cookies.set({
      name: 'accessToken',
      value: accessToken,
      ...cookieOptions,
      maxAge: JWT_ACCESS_EXPIRY_SECONDS,
    });
    
    // Set refresh token cookie
    response.cookies.set({
      name: 'refreshToken',
      value: refreshToken,
      ...cookieOptions,
      maxAge: JWT_REFRESH_EXPIRY_SECONDS,
    });
    
    // Set auth_success flag for detecting successful login in client
    response.cookies.set({
      name: 'auth_success',
      value: 'true',
      path: '/',
      maxAge: 60, // Short-lived, just for initial detection
    });
    
    return response;
  } catch (error) {
    // Log the error
    console.error(`[${new Date().toISOString()}] Google OAuth callback error:`, error);
    
    // Prepare error message
    const errorMessage = error instanceof Error 
      ? encodeURIComponent(error.message) 
      : 'Unknown_error';
    
    // Direct redirect to root with error parameter
    return NextResponse.redirect(`/?auth_error=${errorMessage}`);
  }
}