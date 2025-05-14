import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function GET(request: NextRequest) {
  try {
    console.log(`[2025-05-10 13:23:57] Testing verification API`);
    await connectToDatabase();
    
    // Find the most recently created user
    const user = await User.findOne().sort({ createdAt: -1 });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'No users found in database' 
      });
    }
    
    console.log(`[2025-05-10 13:23:57] Found user: ${user.email}`);
    
    // Check if user already has a token
    const hasExistingToken = !!user.verificationToken;
    
    // Generate a new verification token
    const token = user.generateVerificationToken();
    await user.save();
    
    // Construct the verification URL
    const baseUrl = process.env.CODESPACE_NAME 
      ? `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
    
    return NextResponse.json({
      success: true,
      message: 'Test verification token generated',
      userDetails: {
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        hadExistingToken: hasExistingToken
      },
      verificationLink: verificationUrl,
      token: token
    });
  } catch (error) {
    console.error(`[2025-05-10 13:23:57] Error in test verification:`, error);
    return NextResponse.json({
      success: false,
      message: 'Error generating test verification'
    }, { status: 500 });
  }
}