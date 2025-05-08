import { NextRequest, NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/auth/email-actions';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    
    if (!token) {
      return NextResponse.redirect(new URL('/verify-email?error=Token%20manquant', request.url));
    }
    
    const result = await verifyEmail(token);
    
    if (result.success) {
      return NextResponse.redirect(new URL('/verify-email?success=true', request.url));
    } else {
      return NextResponse.redirect(new URL(`/verify-email?error=${encodeURIComponent(result.message)}`, request.url));
    }
  } catch (error) {
    console.error('Erreur API vérification email:', error);
    return NextResponse.redirect(new URL('/verify-email?error=Erreur%20du%20serveur', request.url));
  }
}