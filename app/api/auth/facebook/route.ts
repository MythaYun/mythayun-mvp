import { NextRequest, NextResponse } from 'next/server';
import { getFacebookOAuthURL } from '@/lib/auth/social-auth';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-14 04:37:12";
const CURRENT_USER = "Sdiabate1337";

export async function GET(request: NextRequest) {
  try {
    console.log(`[${CURRENT_TIMESTAMP}] Initializing Facebook authentication`);
    
    // Generate Facebook authorization URL with proper codespace domain handling
    const url = getFacebookOAuthURL();
    
    console.log(`[${CURRENT_TIMESTAMP}] Facebook OAuth URL generated: ${url}`);
    
    // Return direct redirect
    return NextResponse.redirect(url);
    
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error initializing Facebook authentication:`, error);
    
    // In case of error, redirect to home page with error parameter
    const errorUrl = new URL('/', request.url);
    errorUrl.searchParams.set('error', 'facebook_auth_failed');
    return NextResponse.redirect(errorUrl);
  }
}