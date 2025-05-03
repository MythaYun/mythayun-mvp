import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Session from '@/lib/models/Session';
import { clearAuthCookies, getRefreshTokenFromCookies } from '@/lib/auth/jwt';

/**
 * User logout API
 * Invalidates the session and clears auth cookies
 */
export async function POST(req: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = getRefreshTokenFromCookies();
    
    // If refresh token exists, invalidate it in the database
    if (refreshToken) {
      // Connect to database
      await connectToDatabase();
      
      // Find and invalidate the session
      await Session.updateOne(
        { token: refreshToken },
        { isValid: false }
      );
    }
    
    // Clear auth cookies regardless of whether token exists
    clearAuthCookies();
    
    // Return success response
    return NextResponse.json({
      message: 'Logout successful'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    
    // Clear cookies even if DB operation fails
    clearAuthCookies();
    
    return NextResponse.json(
      { message: 'Logout successful' }, // Still return success to client
      { status: 200 }
    );
  }
}