import { NextRequest, NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/auth/email-actions';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    
    if (!token) {
      return NextResponse.redirect(new URL('/?error=missing-token', request.url));
    }
    
    const result = await verifyEmail(token);
    
    if (result.success) {
      // Redirect to landing page and open login modal with success message
      return NextResponse.redirect(new URL('/?verificationSuccess=true', request.url));
    } else {
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(result.message)}`, request.url));
    }
  } catch (error) {
    console.error('Erreur API vérification email:', error);
    return NextResponse.redirect(new URL('/?error=server-error', request.url));
  }
}