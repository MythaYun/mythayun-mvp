import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';

/**
 * Email verification API
 * Verifies a user's email using the token sent via email
 */
export async function GET(req: NextRequest) {
  try {
    // Get token from URL query parameter
    const token = req.nextUrl.searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { message: 'Missing verification token' },
        { status: 400 }
      );
    }
    
    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Connect to database
    await connectToDatabase();
    
    // Find user with matching token and valid expiry
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationExpires: { $gt: new Date() }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }
    
    // Mark user as verified and clear verification fields
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();
    
    // Return success response
    return NextResponse.json({
      message: 'Email verification successful! You can now log in.'
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { message: 'Email verification failed. Please try again.' },
      { status: 500 }
    );
  }
}