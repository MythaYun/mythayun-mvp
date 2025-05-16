import { NextRequest, NextResponse } from 'next/server';
import { handleFacebookCallback } from '@/lib/auth/social-auth';
import { JWT_ACCESS_EXPIRY_SECONDS, JWT_REFRESH_EXPIRY_SECONDS } from '@/lib/auth/jwt-types';

export async function GET(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Facebook OAuth callback received`);
    
    // Get the authorization code from the request
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorReason = searchParams.get('error_reason');
    const errorDescription = searchParams.get('error_description');
    
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
      
      return NextResponse.redirect(
        `/?auth_error=facebook_${error}`
      );
    }
    
    if (!code) {
      console.error(`[${timestamp}] No authorization code provided by Facebook`);
      return NextResponse.redirect(
        `/?auth_error=facebook_no_code`
      );
    }
    
    // Process the OAuth flow with enhanced error handling
    try {
      const { accessToken, refreshToken, newUser } = await handleFacebookCallback(code);
      
      // Get host from the request
      const host = request.headers.get('host');
      console.log(`[${timestamp}] Host from headers: ${host}`);
      
      // Always redirect to dashboard with absolute URL in Codespaces
      const redirectPath = newUser ? '/dashboard?welcome=true' : '/dashboard';
      
      if (process.env.CODESPACE_NAME) {
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
      
      return response;
    } catch (callbackError) {
      console.error(`[${timestamp}] Error in Facebook callback processing:`, callbackError);
      throw callbackError; // Let the outer catch handle it
    }
  } catch (error) {
    // Log the error
    console.error(`[${new Date().toISOString()}] Facebook OAuth callback error:`, error);
    
    // Prepare error message with more details
    const errorMessage = error instanceof Error 
      ? `facebook_${encodeURIComponent(error.message)}` 
      : 'facebook_unknown_error';
    
    // Direct redirect to root with error parameter
    return NextResponse.redirect(`/?auth_error=${errorMessage}`);
  }
}