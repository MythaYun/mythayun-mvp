import { NextRequest, NextResponse } from 'next/server';
import { sessionUtils } from '@/lib/auth/session';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-13 23:06:42";
const CURRENT_USER = "Sdiabate1337";

export async function GET(request: NextRequest) {
  try {
    console.log(`[${CURRENT_TIMESTAMP}] Retrieving current user session data`);
    
    const user = await sessionUtils.getCurrentUser();
    
    if (user) {
      // Return user without sensitive data
      const safeUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        
        // Profile data
        avatar: user.avatar,
        profilePicture: user.profilePicture, // Added for social auth profile pictures
        bio: user.bio,
        
        // Authentication fields
        isVerified: user.isVerified,
        authProvider: user.authProvider || 'local', // Added for identifying authentication method
        googleId: !!user.googleId, // Just return boolean to indicate if connected (not the actual ID)
        facebookId: !!user.facebookId, // Just return boolean to indicate if connected
        
        // User status
        lastLogin: user.lastLogin,
        isActive: user.isActive,
        
        // User preferences
        favoriteTeams: user.favoriteTeams,
        
        // Timestamps
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      console.log(`[${CURRENT_TIMESTAMP}] Successfully retrieved user: ${user.email}`);
      return NextResponse.json({ success: true, user: safeUser });
    } else {
      console.log(`[${CURRENT_TIMESTAMP}] No authenticated user found`);
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error retrieving user:`, error);
    
    // Determine if error is known and provide specific message
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Erreur inconnue du serveur';
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}