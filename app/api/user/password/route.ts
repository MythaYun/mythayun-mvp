import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth/jwt';
import bcrypt from 'bcrypt';

export async function PUT(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Processing password update`);
    
    // Get access token from cookies
    const accessToken = request.cookies.get("accessToken")?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "Authentication required" }, 
        { status: 401 }
      );
    }
    
    // Verify access token
    let decodedToken;
    try {
      decodedToken = verifyToken(accessToken);
    } catch (error) {
      console.error(`[${timestamp}] Token verification failed:`, error);
      return NextResponse.json(
        { success: false, message: "Invalid authentication token" }, 
        { status: 401 }
      );
    }
    
    if (!decodedToken || !decodedToken.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid authentication token" }, 
        { status: 401 }
      );
    }
    
    const userId = decodedToken.userId;
    
    // Parse the payload from request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      console.error(`[${timestamp}] Invalid request body:`, error);
      return NextResponse.json(
        { success: false, message: "Invalid request format" }, 
        { status: 400 }
      );
    }
    
    const { currentPassword, password } = requestBody;
    
    // Validate inputs
    if (!currentPassword || !password) {
      return NextResponse.json(
        { success: false, message: "Current password and new password are required" }, 
        { status: 400 }
      );
    }
    
    // Connect to database
    try {
      await connectToDatabase();
    } catch (error) {
      console.error(`[${timestamp}] Database connection error:`, error);
      return NextResponse.json(
        { success: false, message: "Database connection error" }, 
        { status: 500 }
      );
    }
    
    // Get current user with password field
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      console.error(`[${timestamp}] User not found: ${userId}`);
      return NextResponse.json(
        { success: false, message: "User not found" }, 
        { status: 404 }
      );
    }
    
    // Verify current password
    let isPasswordValid;
    try {
      isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    } catch (error) {
      console.error(`[${timestamp}] Password comparison error:`, error);
      return NextResponse.json(
        { success: false, message: "Error verifying password" }, 
        { status: 500 }
      );
    }
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" }, 
        { status: 400 }
      );
    }
    
    // Hash new password
    try {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Update password
      user.password = hashedPassword;
      await user.save();
    } catch (error) {
      console.error(`[${timestamp}] Password hashing error:`, error);
      return NextResponse.json(
        { success: false, message: "Error updating password" }, 
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Unhandled error in password update:`, error);
    
    return NextResponse.json(
      { success: false, message: "Failed to update password" }, 
      { status: 500 }
    );
  }
}