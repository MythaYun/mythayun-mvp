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