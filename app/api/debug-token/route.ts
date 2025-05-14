import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({
        error: 'No token provided',
        usage: 'Add ?token=your-token to the URL'
      });
    }
    
    await connectToDatabase();
    
    // Hash the token the same way your verification function does
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Look for a user with this token
    const user = await User.findOne({
      verificationToken: hashedToken
    });
    
    if (!user) {
      // Look for any users with verification tokens for comparison
      const users = await User.find({ 
        verificationToken: { $exists: true }
      }).select('email verificationToken verificationExpires');
      
      // Get a list of all hashed tokens in the database
      const allTokens = users.map(u => ({
        email: u.email,
        tokenPrefix: u.verificationToken?.substring(0, 10),
        expired: u.verificationExpires < new Date()
      }));
      
      return NextResponse.json({
        tokenFound: false,
        providedToken: {
          original: token.substring(0, 10) + '...',
          hashed: hashedToken.substring(0, 10) + '...'
        },
        usersWithTokens: users.length,
        tokenSamples: allTokens,
        message: 'No matching token found in database'
      });
    }
    
    // Check if token is expired
    const isExpired = user.verificationExpires < new Date();
    
    return NextResponse.json({
      tokenFound: true,
      isExpired: isExpired,
      user: {
        email: user.email,
        isVerified: user.isVerified,
        tokenExpiry: user.verificationExpires
      },
      message: isExpired ? 'Token found but expired' : 'Valid token found'
    });
  } catch (error) {
    console.error(`[2025-05-10 13:53:45] Error in debug token:`, error);
    return NextResponse.json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}