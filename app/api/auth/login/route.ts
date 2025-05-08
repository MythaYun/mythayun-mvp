import { NextRequest, NextResponse } from 'next/server';
import { loginAction } from '@/lib/auth/auth-actions';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await loginAction(formData);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 401 });
    }
  } catch (error) {
    console.error('Erreur API login:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur du serveur' },
      { status: 500 }
    );
  }
}