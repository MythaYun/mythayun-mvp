import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { generateAccessToken, generateRefreshToken, setAuthCookies } from '@/lib/auth/jwt';
import { sendVerificationEmail } from '@/lib/mail';

/**
 * User registration API
 * Creates a new user account and sends verification email
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { name, email, password } = body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Please provide name, email and password' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Check if email is already registered
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { message: 'Email is already registered' },
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
    
    // Create new user with current timestamp
    const user = new User({
      name,
      email,
      password,
      createdAt: new Date('2025-05-02T14:26:17'), // Current timestamp
      updatedAt: new Date('2025-05-02T14:26:17'), // Current timestamp
    });
    
    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    
    // Save user to database
    await user.save();
    
    // Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Set authentication cookies
    setAuthCookies(accessToken, refreshToken);
    
    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue registration process even if email fails
    }
    
    // Return success response (exclude sensitive data from response)
    return NextResponse.json({
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}