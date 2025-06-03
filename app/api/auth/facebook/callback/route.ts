import { NextRequest, NextResponse } from 'next/server';
import { handleFacebookCallback } from '@/lib/auth/social-auth';
import { JWT_ACCESS_EXPIRY_SECONDS, JWT_REFRESH_EXPIRY_SECONDS } from '@/lib/auth/jwt-types';

export async function GET(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Facebook OAuth callback received at the correct path /api/auth/callback/facebook`);
    
    // Get the authorization code from the request
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorReason = searchParams.get('error_reason');
    const errorDescription = searchParams.get('error_description');
    
    // Debug environment information
    console.log(`[${timestamp}] Environment: ${process.env.NODE_ENV}, Vercel: ${!!process.env.VERCEL}`);
    console.log(`[${timestamp}] Host: ${request.headers.get('host')}`);
    console.log(`[${timestamp}] URL: ${request.url}`);
    
    // Log detailed parameters for debugging
    console.log(`[${timestamp}] Facebook callback parameters:`, {
      code: code ? 'Provided' : 'Missing',
      error,
      errorReason,
      errorDescription,
      state: searchParams.get('state') ? 'Provided' : 'Missing'
    });
    
    if (error) {
      console.error(`[${timestamp}] Facebook OAuth error:`, {
        error,
        reason: errorReason,
        description: errorDescription
      });
      
      return NextResponse.redirect(`${new URL('/', request.url)}?auth_error=facebook_${error}`);
    }
    
    if (!code) {
      console.error(`[${timestamp}] No authorization code provided by Facebook`);
      return NextResponse.redirect(`${new URL('/', request.url)}?auth_error=facebook_no_code`);
    }
    
    // Process the OAuth flow
    const { accessToken, refreshToken, newUser } = await handleFacebookCallback(code);
    
    // Use welcome=true parameter for onboarding new users
    const redirectPath = newUser ? '/dashboard?welcome=true' : '/dashboard';
    console.log(`[${timestamp}] User is ${newUser ? 'new' : 'returning'}, redirecting to ${redirectPath}`);
    
    // Prepare the redirect response using the URL constructor to ensure proper base URL handling
    const redirectUrl = new URL(redirectPath, request.url);
    console.log(`[${timestamp}] Redirecting to: ${redirectUrl.toString()}`);
    
    const response = NextResponse.redirect(redirectUrl);
    
    // Set cookie options based on environment
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Always secure in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const, // 'none' for cross-site in production
      path: '/',
    };
    
    console.log(`[${timestamp}] Setting cookies with options:`, {
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      environment: process.env.NODE_ENV
    });
    
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
    
    console.log(`[${timestamp}] Cookies set, returning redirect response`);
    return response;
    
  } catch (error) {
    // Log the error with detailed information
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Facebook OAuth callback error:`, error);
    
    if (error instanceof Error) {
      console.error(`[${timestamp}] Error name: ${error.name}, message: ${error.message}`);
      console.error(`[${timestamp}] Stack trace: ${error.stack}`);
    }
    
    // Prepare error message
    const errorMessage = error instanceof Error 
      ? encodeURIComponent(error.message) 
      : 'Unknown_error';
    
    // Direct redirect to root with error parameter
    return NextResponse.redirect(`${new URL('/', request.url)}?auth_error=facebook_${errorMessage}`);
  }
}