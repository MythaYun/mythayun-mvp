import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { sendPasswordResetEmail } from '@/lib/mail';

/**
 * Forgot password API
 * Generates a password reset token and sends it via email
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { message: 'Please provide your email address' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Find user by email
    const user = await User.findByEmail(email);
    
    // Always return success even if user not found for security
    if (!user) {
      return NextResponse.json({
        message: 'If your email is registered, you will receive a password reset link shortly.'
      });
    }
    
    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();
    
    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return NextResponse.json(
        { message: 'Failed to send password reset email. Please try again.' },
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json({
      message: 'If your email is registered, you will receive a password reset link shortly.'
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { message: 'Failed to process request. Please try again.' },
      { status: 500 }
    );
  }
}