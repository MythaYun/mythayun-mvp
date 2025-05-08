import { NextRequest, NextResponse } from 'next/server';
import { registerAction } from '@/lib/auth/auth-actions';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await registerAction(formData);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('Erreur API inscription:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur du serveur' },
      { status: 500 }
    );
  }
}