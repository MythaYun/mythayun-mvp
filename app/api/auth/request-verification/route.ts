import { NextRequest, NextResponse } from 'next/server';
import { requestVerificationEmail } from '@/lib/auth/email-actions';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email requis' },
        { status: 400 }
      );
    }
    
    const result = await requestVerificationEmail(email);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur API demande de vérification:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur du serveur' },
      { status: 500 }
    );
  }
}