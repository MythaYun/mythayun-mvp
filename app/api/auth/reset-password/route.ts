import { NextRequest, NextResponse } from 'next/server';
import { resetPassword } from '@/lib/auth/email-actions';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    
    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: 'Token et nouveau mot de passe requis' },
        { status: 400 }
      );
    }
    
    const result = await resetPassword(token, password);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur API réinitialisation mot de passe:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur du serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get token from the URL
    const token = request.nextUrl.searchParams.get('token');
    
    console.log(`[2025-05-13 21:18:21] Processing reset password link with token: ${token?.substring(0, 10)}...`);
    
    // Construct the base URL correctly based on environment
    const baseUrl = process.env.CODESPACE_NAME 
      ? `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Redirect to home page with parameters to open the reset password modal
    if (token) {
      return NextResponse.redirect(`${baseUrl}/?openModal=resetPassword&token=${encodeURIComponent(token)}`);
    } else {
      return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent('Token de réinitialisation manquant')}`);
    }
  } catch (error) {
    console.error(`[2025-05-13 21:18:21] Error processing reset password link:`, error);
    
    const baseUrl = process.env.CODESPACE_NAME 
      ? `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent('Erreur lors du traitement du lien')}`);
  }
}