import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';

/**
 * Reset password API
 * Allows users to set a new password using a valid reset token
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { token, password } = body;
    
    if (!token || !password) {
      return NextResponse.json(
        { message: 'Please provide token and new password' },
        { status: 400 }
      );
    }
    
    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
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
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired password reset token' },
        { status: 400 }
      );
    }
    
    // Set new password and clear reset fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    // Return success response
    return NextResponse.json({
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { message: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}