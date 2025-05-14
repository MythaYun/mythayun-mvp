import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/utils/email';

export async function GET(request: NextRequest) {
  const testEmail = 'test@example.com';
  const testName = 'Utilisateur Test';
  const testToken = 'test-verification-token-' + Date.now();
  
  // Get codespace name for proper URL construction
  const codespaceUrl = process.env.CODESPACE_NAME 
    ? `https://${process.env.CODESPACE_NAME}-8025.app.github.dev`
    : 'http://localhost:8025';
  
  // Get the base URL for our application
  const baseUrl = process.env.CODESPACE_NAME 
    ? `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Log debugging information
  console.log(`[2025-05-10 03:09:10] Sending test email to ${testEmail}`);
  console.log(`[2025-05-10 03:09:10] Using base URL: ${baseUrl}`);
  console.log(`[2025-05-10 03:09:10] MailHog URL: ${codespaceUrl}`);
  
  // Send verification email
  const result = await sendVerificationEmail(testEmail, testName, testToken);
  
  return NextResponse.json({ 
    success: result,
    message: result ? 'Email envoyé avec succès' : 'Échec de l\'envoi',
    details: {
      to: testEmail,
      token: testToken,
      baseUrl: baseUrl,
      mailhogUrl: codespaceUrl,
      timestamp: new Date().toISOString()
    }
  });
}