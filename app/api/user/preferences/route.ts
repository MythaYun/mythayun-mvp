import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth/jwt"; // Use your actual verifyToken function

// Current system information
const CURRENT_TIMESTAMP = "2025-05-16 01:02:12";

export async function PUT(request: NextRequest) {
  try {
    console.log(`[${CURRENT_TIMESTAMP}] Processing user preferences update`);
    
    // Get access token from cookies
    const accessToken = request.cookies.get("accessToken")?.value;
    
    if (!accessToken) {
      console.error(`[${CURRENT_TIMESTAMP}] No access token provided in cookies`);
      return NextResponse.json(
        { success: false, message: "Authentication required" }, 
        { status: 401 }
      );
    }
    
    // Verify access token using your verifyToken function (single argument)
    const decodedToken = verifyToken(accessToken);
    
    if (!decodedToken || !decodedToken.userId) {
      console.error(`[${CURRENT_TIMESTAMP}] Invalid access token`);
      return NextResponse.json(
        { success: false, message: "Invalid authentication token" }, 
        { status: 401 }
      );
    }
    
    const userId = decodedToken.userId;
    
    // Parse the preferences from request body
    const preferences = await request.json();
    
    if (!preferences || typeof preferences !== 'object') {
      console.error(`[${CURRENT_TIMESTAMP}] Invalid preferences data`);
      return NextResponse.json(
        { success: false, message: "Invalid preferences data" },
        { status: 400 }
      );
    }
    
    console.log(`[${CURRENT_TIMESTAMP}] Updating preferences for user ID: ${userId}`);
    
    // Connect to the database
    await connectToDatabase();
    
    // Update user preferences
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          preferences,
          // Mark that the user completed onboarding
          hasCompletedOnboarding: true,
          isNewUser: false
        } 
      },
      { new: true, select: '-password' }
    );
    
    if (!updatedUser) {
      console.error(`[${CURRENT_TIMESTAMP}] User not found: ${userId}`);
      return NextResponse.json(
        { success: false, message: "User not found" }, 
        { status: 404 }
      );
    }
    
    console.log(`[${CURRENT_TIMESTAMP}] Preferences updated successfully for user: ${updatedUser.email}`);
    
    // Return updated user data (without sensitive information)
    return NextResponse.json({
      success: true,
      message: "Preferences updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        preferences: updatedUser.preferences,
        hasCompletedOnboarding: updatedUser.hasCompletedOnboarding
      }
    });
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error updating preferences:`, error);
    
    return NextResponse.json(
      { success: false, message: "Failed to update preferences" }, 
      { status: 500 }
    );
  }
}