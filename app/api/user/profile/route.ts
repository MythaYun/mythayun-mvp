import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth/jwt';

export async function PUT(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Processing user profile update`);
    
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
    
    // Parse the profile data from request body
    let profileData;
    try {
      profileData = await request.json();
      console.log(`[${timestamp}] Profile update data:`, JSON.stringify(profileData));
    } catch (error) {
      console.error(`[${timestamp}] Invalid request body:`, error);
      return NextResponse.json(
        { success: false, message: "Invalid request format" }, 
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
    
    // Get current user
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" }, 
        { status: 404 }
      );
    }
    
    // Update user properties
    let emailChanged = false;
    
    if (profileData.name) {
      user.name = profileData.name;
    }
    
    if (profileData.email && profileData.email !== user.email) {
      // Check if email is already in use
      const existingUser = await User.findOne({ email: profileData.email });
      
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: "Email already in use" }, 
          { status: 400 }
        );
      }
      
      user.email = profileData.email;
      emailChanged = true;
      
      // If email is changed, require verification again
      user.isVerified = false;
      
      // Generate verification token - implement according to your system
      // const verificationToken = user.generateVerificationToken();
      
      // Send verification email - implement according to your system
      // await sendVerificationEmail(user.email, user.name, verificationToken);
    }
    
    // Save user
    try {
      await user.save();
      console.log(`[${timestamp}] User profile updated successfully`);
    } catch (error) {
      console.error(`[${timestamp}] Error saving user:`, error);
      return NextResponse.json(
        { success: false, message: "Error saving profile changes" }, 
        { status: 500 }
      );
    }
    
    // Return updated user data without sensitive information
    return NextResponse.json({
      success: true,
      message: emailChanged ? 
        "Profile updated successfully. Please verify your new email address." : 
        "Profile updated successfully",
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        preferences: user.preferences || {}
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error updating user profile:`, error);
    
    return NextResponse.json(
      { success: false, message: "Failed to update profile" }, 
      { status: 500 }
    );
  }
}