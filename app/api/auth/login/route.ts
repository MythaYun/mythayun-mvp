import { NextRequest, NextResponse } from 'next/server';
import { loginAction } from '@/lib/auth/auth-actions';
import { rateLimit } from '@/lib/utils/rate-limit';
import { JWT_ACCESS_EXPIRY_SECONDS, JWT_REFRESH_EXPIRY_SECONDS } from '@/lib/auth/jwt-types';

// Configure rate limiter: 5 login attempts per minute per IP
const loginLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute in milliseconds
  uniqueTokenPerInterval: 500, // Max number of unique IPs to track
});

// Global login attempts tracking for additional security
const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds
const failedAttempts = new Map<string, { count: number, timestamp: number }>();

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Login attempt received`);
  
  try {
    // Extract IP address or fallback to a unique identifier
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown-ip';
    
    // Apply rate limiting
    try {
      await loginLimiter.check(5, ip); // 5 requests per minute per IP
    } catch (rateLimitError: any) {
      console.log(`[${timestamp}] Rate limit exceeded for IP: ${ip}`);
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Trop de tentatives de connexion. Veuillez réessayer dans quelques minutes.' 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitError.retryAfter || 60),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }
    
    // Extract credentials from request
    let email: string | null = null;
    let password: string | null = null;
    
    // Handle different content types
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        const jsonData = await request.json();
        email = jsonData.email;
        password = jsonData.password;
      } catch (error) {
        return NextResponse.json(
          { success: false, message: 'Format de requête invalide' },
          { status: 400 }
        );
      }
    } else {
      try {
        const formData = await request.formData();
        email = formData.get('email') as string;
        password = formData.get('password') as string;
      } catch (error) {
        return NextResponse.json(
          { success: false, message: 'Format de requête invalide' },
          { status: 400 }
        );
      }
    }
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }
    
    // Check global lockout status
    const emailKey = email.toLowerCase();
    const emailAttempts = failedAttempts.get(emailKey);
    
    if (emailAttempts && emailAttempts.count >= MAX_FAILED_ATTEMPTS) {
      const lockoutExpiry = emailAttempts.timestamp + LOCKOUT_TIME;
      
      if (Date.now() < lockoutExpiry) {
        const minutesRemaining = Math.ceil((lockoutExpiry - Date.now()) / 60000);
        
        return NextResponse.json(
          { 
            success: false, 
            message: `Compte temporairement verrouillé suite à plusieurs tentatives échouées. Veuillez réessayer dans ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''} ou réinitialiser votre mot de passe.` 
          },
          { status: 423 }
        );
      } else {
        // Lockout expired, reset counter
        failedAttempts.delete(emailKey);
      }
    }
    
    // Prepare data for login action
    const data = new FormData();
    data.append('email', email);
    data.append('password', password);
    
    // Call login action
    const result = await loginAction(data);
    
    // Handle successful login
    if (result.success) {
      // Reset rate limits on successful login
      loginLimiter.reset(ip);
      if (emailKey) failedAttempts.delete(emailKey);
      
      // Create a response object
      const response = NextResponse.json(result);
      
      // Detect GitHub Codespaces environment
      const isGitHubCodespaces = process.env.CODESPACES === 'true' || 
                                process.env.GITHUB_CODESPACES === 'true' || 
                                process.env.NEXT_PUBLIC_APP_URL?.includes('.app.github.dev');
                                
      // Set cookie security options based on environment
      const cookieOptions = {
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production' || isGitHubCodespaces,
        sameSite: isGitHubCodespaces ? 'none' as const : 'lax' as const,
        path: '/',
      };
      
      // Set access token cookie
      if (result.accessToken) {
        response.cookies.set({
          name: 'accessToken', // IMPORTANT: Use consistent name with getAccessToken()
          value: result.accessToken,
          ...cookieOptions,
          maxAge: JWT_ACCESS_EXPIRY_SECONDS,
        });
        
        console.log(`[${timestamp}] Access token cookie set for user: ${result.user?.email}`);
      }
      
      // Set refresh token cookie
      if (result.refreshToken) {
        response.cookies.set({
          name: 'refreshToken', // IMPORTANT: Use consistent name with getRefreshToken()
          value: result.refreshToken,
          ...cookieOptions,
          maxAge: JWT_REFRESH_EXPIRY_SECONDS,
        });
        
        console.log(`[${timestamp}] Refresh token cookie set for user: ${result.user?.email}`);
      }
      
      // For backward compatibility if still using token property
      if (!result.accessToken && result.token) {
        response.cookies.set({
          name: 'accessToken',
          value: result.token,
          ...cookieOptions,
          maxAge: JWT_ACCESS_EXPIRY_SECONDS,
        });
        
        console.log(`[${timestamp}] Legacy token cookie set for user: ${result.user?.email}`);
      }
      
      console.log(`[${timestamp}] Login successful for: ${result.user?.email}`, {
        hasAccessToken: !!result.accessToken,
        hasRefreshToken: !!result.refreshToken,
        hasLegacyToken: !result.accessToken && !!result.token,
        isGitHubCodespaces,
        cookieSettings: {
          ...cookieOptions,
          accessMaxAge: JWT_ACCESS_EXPIRY_SECONDS,
          refreshMaxAge: JWT_REFRESH_EXPIRY_SECONDS
        }
      });
      
      return response;
    } 
    // Handle login failure
    else {
      // Update failed attempts tracker
      if (emailKey) {
        const attempts = failedAttempts.get(emailKey) || { count: 0, timestamp: Date.now() };
        attempts.count++;
        attempts.timestamp = Date.now(); // Update timestamp on each attempt
        failedAttempts.set(emailKey, attempts);
        
        const remainingAttempts = MAX_FAILED_ATTEMPTS - attempts.count;
        
        if (remainingAttempts <= 3 && remainingAttempts > 0) {
          result.message = `${result.message} (${remainingAttempts} tentative${remainingAttempts > 1 ? 's' : ''} restante${remainingAttempts > 1 ? 's' : ''})`;
        }
      }
      
      // Map error messages to appropriate status codes
      let statusCode = 401; // Default for auth failures
      
      if (result.message?.includes('vérifier votre email')) {
        statusCode = 403;
      } else if (result.message?.includes('verrouillé')) {
        statusCode = 423;
      }
      
      return NextResponse.json(result, { status: statusCode });
    }
    
  } catch (error) {
    console.error(`[${timestamp}] Login error:`, error);
    
    // Return generic server error
    const errorMessage = process.env.NODE_ENV === 'development'
      ? (error instanceof Error ? error.message : String(error))
      : 'Une erreur s\'est produite. Veuillez réessayer plus tard.';
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}