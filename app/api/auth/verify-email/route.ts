import { NextRequest, NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/auth/email-actions';

export async function GET(request: NextRequest) {
  const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);

  try {
    // Get token from query params
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    console.log(`[${currentTime}] Processing email verification for token: ${token?.substring(0, 10)}...`);
    
    // IMPORTANT: Construct the base URL for redirects correctly
    // This is the critical fix that prevents port duplication
    const baseUrl = process.env.CODESPACE_NAME 
      ? `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    console.log(`[${currentTime}] Using base URL for redirects: ${baseUrl}`);
    
    if (!token) {
      console.log(`[${currentTime}] No token provided`);
      return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent('Missing verification token')}`);
    }
    
    // Call the verification function
    const result = await verifyEmail(token);
    console.log(`[${currentTime}] Verification result: ${JSON.stringify(result)}`);
    
    // Redirect based on result
    if (result.success) {
      console.log(`[${currentTime}] Verification successful, redirecting to success page`);
      return NextResponse.redirect(`${baseUrl}/?verificationSuccess=true`);
    } else {
      console.log(`[${currentTime}] Verification failed: ${result.message}`);
      return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(result.message)}`);
    }
  } catch (error) {
    console.error(`[${currentTime}] Error in verification:`, error);
    
    // Handle errors with proper redirect
    const baseUrl = process.env.CODESPACE_NAME 
      ? `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    return NextResponse.redirect(
      `${baseUrl}/?error=${encodeURIComponent('Server error during verification process')}`
    );
  }
}