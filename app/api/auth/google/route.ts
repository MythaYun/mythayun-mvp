import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuthURL } from '@/lib/auth/social-auth';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-14 02:19:04";

export async function GET(request: NextRequest) {
  try {
    console.log(`[${CURRENT_TIMESTAMP}] Initializing Google authentication`);
    
    // Generate Google authorization URL
    const url = getGoogleOAuthURL();
    
    // IMPORTANT FIX: Instead of returning JSON with the URL, redirect directly
    return NextResponse.redirect(url);
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error initializing Google authentication:`, error);
    
    // In case of error, redirect to the home page with an error parameter
    const errorUrl = new URL('/', request.url);
    errorUrl.searchParams.set('error', 'google_auth_failed');
    return NextResponse.redirect(errorUrl);
  }
}