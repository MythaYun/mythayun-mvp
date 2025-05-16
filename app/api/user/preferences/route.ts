import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth/jwt"; // Use your actual verifyToken function

export async function PUT(request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`[${timestamp}] Processing user preferences update`);
    
    // Get access token from cookies
    const accessToken = request.cookies.get("accessToken")?.value;
    
    if (!accessToken) {
      console.error(`[${timestamp}] No access token provided in cookies`);
      return NextResponse.json(
        { success: false, message: "Authentication required" }, 
        { status: 401 }
      );
    }
    
    // Verify access token using your verifyToken function
    let decodedToken;
    try {
      decodedToken = verifyToken(accessToken);
    } catch (error) {
      console.error(`[${timestamp}] Token verification error:`, error);
      return NextResponse.json(
        { success: false, message: "Invalid authentication token" }, 
        { status: 401 }
      );
    }
    
    if (!decodedToken || !decodedToken.userId) {
      console.error(`[${timestamp}] Invalid access token structure`);
      return NextResponse.json(
        { success: false, message: "Invalid token structure" }, 
        { status: 401 }
      );
    }
    
    const userId = decodedToken.userId;
    
    // Parse the preferences from request body
    let preferences;
    try {
      preferences = await request.json();
    } catch (error) {
      console.error(`[${timestamp}] Error parsing request body:`, error);
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    if (!preferences || typeof preferences !== 'object') {
      console.error(`[${timestamp}] Invalid preferences data`);
      return NextResponse.json(
        { success: false, message: "Invalid preferences data" },
        { status: 400 }
      );
    }
    
    // Log the preferences we're about to save
    console.log(`[${timestamp}] Updating preferences for user ID: ${userId}`);
    console.log(`[${timestamp}] Preferences payload:`, JSON.stringify(preferences));
    
    // Connect to the database
    await connectToDatabase();
    
    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error(`[${timestamp}] Invalid user ID format: ${userId}`);
      return NextResponse.json(
        { success: false, message: "Invalid user ID format" }, 
        { status: 400 }
      );
    }
    
    // Update user preferences with more detailed update document
    const updateDoc = { 
      $set: { 
        preferences: preferences,
        hasCompletedOnboarding: true,
        isNewUser: false,
        updatedAt: new Date()
      } 
    };
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateDoc,
      { new: true, select: '-password' }
    );
    
    if (!updatedUser) {
      console.error(`[${timestamp}] User not found: ${userId}`);
      return NextResponse.json(
        { success: false, message: "User not found" }, 
        { status: 404 }
      );
    }
    
    // Double-check the update succeeded
    if (!updatedUser.preferences || !updatedUser.hasCompletedOnboarding) {
      console.error(`[${timestamp}] Update may have failed - hasCompletedOnboarding: ${updatedUser.hasCompletedOnboarding}`);
      console.error(`[${timestamp}] Preferences after update:`, JSON.stringify(updatedUser.preferences));
    }
    
    console.log(`[${timestamp}] Preferences updated successfully for user: ${updatedUser.email}`);
    console.log(`[${timestamp}] Updated preferences:`, JSON.stringify(updatedUser.preferences));
    
    // Return updated user data (without sensitive information)
    return NextResponse.json({
      success: true,
      message: "Preferences updated successfully",
      user: {
        _id: updatedUser._id.toString(), // Ensure ID is a string
        name: updatedUser.name,
        email: updatedUser.email,
        preferences: updatedUser.preferences,
        hasCompletedOnboarding: updatedUser.hasCompletedOnboarding,
        isNewUser: updatedUser.isNewUser
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error updating preferences:`, error);
    
    // Include more error details in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Failed to update preferences: ${error instanceof Error ? error.message : String(error)}`
      : "Failed to update preferences";
    
    return NextResponse.json(
      { success: false, message: errorMessage }, 
      { status: 500 }
    );
  }
}