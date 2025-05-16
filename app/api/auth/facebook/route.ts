import { NextRequest, NextResponse } from 'next/server';
import { getFacebookOAuthURL } from '@/lib/auth/social-auth';

export async function GET(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Initializing Facebook authentication`);
    
    // Generate Facebook OAuth URL with enhanced debugging
    const url = getFacebookOAuthURL();
    console.log(`[${timestamp}] Facebook OAuth URL generated: ${url.substring(0, 100)}...`);
    
    // Add detailed logging for troubleshooting
    console.log(`[${timestamp}] Facebook auth parameters:`, {
      appId: process.env.FACEBOOK_APP_ID ? 'Set' : 'Missing',
      appSecret: process.env.FACEBOOK_APP_SECRET ? 'Set' : 'Missing',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`,
      host: request.headers.get('host'),
      referrer: request.headers.get('referer')
    });
    
    // Direct server-side redirect
    return NextResponse.redirect(url);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error initializing Facebook authentication:`, error);
    
    // Log detailed error for debugging
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack?.substring(0, 500)
    } : { message: 'Unknown error' };
    
    console.error(`[${new Date().toISOString()}] Facebook auth error details:`, errorDetails);
    
    // In case of error, redirect to the home page with an error parameter
    const errorUrl = new URL('/?auth_error=facebook_auth_failed', request.url);
    return NextResponse.redirect(errorUrl);
  }
}