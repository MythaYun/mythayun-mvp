import { NextRequest, NextResponse } from 'next/server';
import { sessionUtils } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/dashboard';
  
  try {
    const result = await sessionUtils.refreshSession();
    
    if (result.success) {
      return NextResponse.redirect(new URL(decodeURI(redirectTo), request.url));
    } else {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('message', 'Votre session a expiré');
      loginUrl.searchParams.set('redirectTo', redirectTo);
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    console.error('Erreur API rafraîchissement token:', error);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('message', 'Erreur d\'authentification');
    return NextResponse.redirect(loginUrl);
  }
}