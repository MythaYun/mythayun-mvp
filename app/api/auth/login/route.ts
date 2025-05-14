import { NextRequest, NextResponse } from 'next/server';
import { loginAction } from '@/lib/auth/auth-actions';

export async function POST(request: NextRequest) {
  try {
    // Handle both JSON and FormData formats
    let data: FormData;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Handle JSON request
      const jsonData = await request.json();
      // Convert JSON to FormData for compatibility with loginAction
      data = new FormData();
      Object.entries(jsonData).forEach(([key, value]) => {
        data.append(key, value as string);
      });
      console.log(`[${new Date().toISOString()}] Handling JSON login for: ${jsonData.email || 'unknown'}`);
    } else {
      // Handle FormData request (your existing code)
      data = await request.formData();
      console.log(`[${new Date().toISOString()}] Handling FormData login`);
    }
    
    // Pass to loginAction
    const result = await loginAction(data);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 401 });
    }
  } catch (error) {
    console.error('Erreur API login:', error);
    // Include more detailed error info in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : String(error))
      : 'Erreur du serveur';
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}