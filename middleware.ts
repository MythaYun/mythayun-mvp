import { NextRequest, NextResponse } from 'next/server';
import { jwtUtils } from './lib/auth/jwt';

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-07 15:07:46";
const CURRENT_USER = "Sdiabate1337";

// Définir les chemins protégés
const PROTECTED_PATHS = [
  '/dashboard',
  '/profile',
  '/settings',
];

// Définir les chemins réservés aux administrateurs
const ADMIN_PATHS = [
  '/admin',
];

// Liste des chemins publics d'authentification
const AUTH_PATHS = [
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rediriger vers le tableau de bord si l'utilisateur est déjà connecté et tente d'accéder aux pages d'authentification
  if (AUTH_PATHS.some(path => pathname.startsWith(path))) {
    const accessToken = jwtUtils.middlewareUtils.getAccessTokenFromRequest(request);
    if (accessToken) {
      const payload = jwtUtils.verifyToken(accessToken);
      if (payload) {
        console.log(`[${CURRENT_TIMESTAMP}] Redirection depuis ${pathname} vers /dashboard (utilisateur déjà connecté)`);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }
  
  // Ignorer le middleware pour les routes non protégées
  if (!PROTECTED_PATHS.some(path => pathname.startsWith(path)) && 
      !ADMIN_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Récupérer le token d'accès des cookies
  const accessToken = jwtUtils.middlewareUtils.getAccessTokenFromRequest(request);
  
  if (!accessToken) {
    console.log(`[${CURRENT_TIMESTAMP}] Accès non autorisé à ${pathname}: token d'accès manquant`);
    // Rediriger vers la connexion avec l'URL d'origine comme paramètre
    const url = new URL('/login', request.url);
    url.searchParams.set('redirectTo', encodeURI(pathname));
    return NextResponse.redirect(url);
  }
  
  // Vérifier le token
  const payload = jwtUtils.verifyToken(accessToken);
  
  if (!payload) {
    console.log(`[${CURRENT_TIMESTAMP}] Accès non autorisé à ${pathname}: token d'accès invalide ou expiré`);
    // Essayer d'utiliser le token de rafraîchissement via une redirection
    const url = new URL('/api/auth/refresh', request.url);
    url.searchParams.set('redirectTo', encodeURI(pathname));
    return NextResponse.redirect(url);
  }
  
  // Vérifier les chemins réservés aux administrateurs
  if (ADMIN_PATHS.some(path => pathname.startsWith(path)) && payload.role !== 'admin') {
    console.log(`[${CURRENT_TIMESTAMP}] Accès non autorisé à ${pathname}: rôle ${payload.role} insuffisant (admin requis)`);
    return NextResponse.redirect(new URL('/dashboard?message=Vous n\'avez pas les autorisations nécessaires', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Routes d'authentification
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    
    // Chemins protégés
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
};