import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get current codespace name from env
    const codespace = process.env.CODESPACE_NAME || 'studious-zebra-x5xqvvw5rwg53w7g';
    
    // Get base URL for the app
    const baseUrl = `https://${codespace}-3000.app.github.dev`;
    
    // Sample verification token
    const token = "sample-token-" + new Date().getTime();
    
    // Sample verification URL
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
    
    // Email HTML template
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">Bienvenue sur MythaYun!</h2>
        <p>Bonjour Test User,</p>
        <p>Merci de vous être inscrit sur MythaYun. Pour activer votre compte, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Vérifier mon email</a>
        </div>
        <p>Ou copiez et collez ce lien dans votre navigateur:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>Ce lien expirera dans 24 heures.</p>
        <p>Si vous n'avez pas créé de compte, veuillez ignorer cet email.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eaeaea;" />
        <p style="color: #6b7280; font-size: 14px;">L'équipe MythaYun<br>© 2025 MythaYun. Tous droits réservés.</p>
      </div>
    `;
    
    // Return the rendered HTML directly
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error(`[2025-05-10 13:37:18] Error in debug-email:`, error);
    return NextResponse.json({
      success: false,
      message: 'Error generating email preview'
    }, { status: 500 });
  }
}