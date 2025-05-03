import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';
import Session from '@/lib/models/Session';
import { generateAccessToken, generateRefreshToken, setAuthCookies } from '@/lib/auth/jwt';

/**
 * User login API
 * Authenticates a user and sets session cookies
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { email, password } = body;
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Please provide email and password' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check if account is locked
    if (user.isLocked) {
      const lockTime = user.lockUntil ? new Date(user.lockUntil).toISOString() : 'unknown';
      return NextResponse.json(
        { message: `Account is temporarily locked. Please try again after ${lockTime}` },
        { status: 423 } // Locked status code
      );
    }
    
    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    
    // If password is invalid, increment login attempts
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    // Update last login time with current timestamp
    user.lastLogin = new Date('2025-05-02T14:26:17');
    await user.save();
    
    // Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Set authentication cookies
    setAuthCookies(accessToken, refreshToken);
    
    // Create session record
    await Session.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      userAgent: req.headers.get('user-agent') || 'unknown',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });
    
    // Return success response (exclude sensitive data)
    return NextResponse.json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        favoriteTeams: user.favoriteTeams,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}