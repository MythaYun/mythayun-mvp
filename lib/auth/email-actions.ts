'use server';

import { connectToDatabase } from '../db/mongodb';
import User from '../models/User';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import crypto from 'crypto';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-10 02:21:09";
const CURRENT_USER = "Sdiabate1337";

// Response types
type EmailActionResult = {
  success: boolean;
  message: string;
};

/**
 * Request verification email
 */
export async function requestVerificationEmail(email: string): Promise<EmailActionResult> {
  try {
    console.log(`[${CURRENT_TIMESTAMP}] Requesting verification email for: ${email}`);
    
    await connectToDatabase();
    
    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal if email exists for security reasons
      console.log(`[${CURRENT_TIMESTAMP}] Email not found: ${email}`);
      return { 
        success: true, 
        message: 'If this email address exists in our system, a verification email will be sent.'
      };
    }
    
    // If already verified
    if (user.isVerified) {
      console.log(`[${CURRENT_TIMESTAMP}] Email already verified: ${email}`);
      return { 
        success: false, 
        message: 'This email address is already verified.'
      };
    }
    
    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();
    
    // Send email
    const emailSent = await sendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );
    
    if (emailSent) {
      console.log(`[${CURRENT_TIMESTAMP}] Verification email sent to: ${email}`);
      return { 
        success: true, 
        message: 'A verification email has been sent.'
      };
    } else {
      console.error(`[${CURRENT_TIMESTAMP}] Failed to send verification email to: ${email}`);
      return { 
        success: false, 
        message: 'Unable to send verification email.'
      };
    }
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error requesting verification:`, error);
    return { 
      success: false, 
      message: 'An error occurred while processing your verification request.'
    };
  }
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<EmailActionResult> {
  try {
    const currentTime = "2025-05-10 13:23:57";
    console.log(`[${currentTime}] Verifying email with token: ${token.substring(0, 10)}...`);
    
    await connectToDatabase();
    
    // Hash token for comparison with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    console.log(`[${currentTime}] Hashed token: ${hashedToken.substring(0, 10)}...`);
    
    // Find user with this token
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationExpires: { $gt: new Date() }
    });
    
    if (!user) {
      console.log(`[${currentTime}] No user found with the provided token`);
      
      // Debug: Check if there are any users with verification tokens
      const anyUserWithToken = await User.findOne({ 
        verificationToken: { $exists: true } 
      });
      
      if (anyUserWithToken) {
        console.log(`[${currentTime}] Found a user with some verification token: ${anyUserWithToken.email}`);
      } else {
        console.log(`[${currentTime}] No users have verification tokens set`);
      }
      
      return { 
        success: false, 
        message: 'The verification link is invalid or has expired.'
      };
    }
    
    console.log(`[${currentTime}] Found user: ${user.email}`);
    
    // Mark email as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();
    
    console.log(`[${currentTime}] Email verified successfully for: ${user.email}`);
    return { 
      success: true, 
      message: 'Your email has been verified successfully.'
    };
  } catch (error) {
    console.error(`[2025-05-10 13:23:57] Error verifying email:`, error);
    return { 
      success: false, 
      message: 'An error occurred while verifying your email.'
    };
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<EmailActionResult> {
  try {
    console.log(`[${CURRENT_TIMESTAMP}] Requesting password reset for: ${email}`);
    
    await connectToDatabase();
    
    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal if email exists for security reasons
      console.log(`[${CURRENT_TIMESTAMP}] Email not found for password reset: ${email}`);
      return { 
        success: true, 
        message: 'If this email address exists in our system, a reset email will be sent.'
      };
    }
    
    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();
    
    // Send email
    const emailSent = await sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken
    );
    
    if (emailSent) {
      console.log(`[${CURRENT_TIMESTAMP}] Password reset email sent to: ${email}`);
      return { 
        success: true, 
        message: 'A password reset email has been sent.'
      };
    } else {
      console.error(`[${CURRENT_TIMESTAMP}] Failed to send password reset email to: ${email}`);
      return { 
        success: false, 
        message: 'Unable to send password reset email.'
      };
    }
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error requesting password reset:`, error);
    return { 
      success: false, 
      message: 'An error occurred while processing your password reset request.'
    };
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(
  token: string, 
  newPassword: string
): Promise<EmailActionResult> {
  try {
    console.log(`[${CURRENT_TIMESTAMP}] Resetting password with token: ${token.substring(0, 10)}...`);
    
    await connectToDatabase();
    
    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      return { 
        success: false, 
        message: 'New password must be at least 8 characters long.'
      };
    }
    
    // Hash token for comparison with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with this token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });
    
    if (!user) {
      console.log(`[${CURRENT_TIMESTAMP}] Invalid or expired reset token: ${token.substring(0, 10)}...`);
      return { 
        success: false, 
        message: 'The password reset link is invalid or has expired.'
      };
    }
    
    // Update password
    user.password = newPassword; // Will be hashed by mongoose middleware
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    console.log(`[${CURRENT_TIMESTAMP}] Password reset successful for: ${user.email}`);
    return { 
      success: true, 
      message: 'Your password has been reset successfully.'
    };
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error resetting password:`, error);
    return { 
      success: false, 
      message: 'An error occurred while resetting your password.'
    };
  }
}