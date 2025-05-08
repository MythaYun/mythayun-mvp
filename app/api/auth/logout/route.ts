import { NextRequest, NextResponse } from 'next/server';
import { logoutAction } from '@/lib/auth/auth-actions';

export async function POST(request: NextRequest) {
  try {
    const result = await logoutAction();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur API déconnexion:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur du serveur' },
      { status: 500 }
    );
  }
}