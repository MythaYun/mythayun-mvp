import { randomUUID } from 'crypto';
import { connectToDatabase } from '../db/mongodb';
import User from '../models/User'; // Fixed import - using default export
import { generateAccessToken } from './jwt';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-13 22:46:07";
const CURRENT_USER = "Sdiabate1337";

// OAuth constants
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';

// Base URL function
const getBaseUrl = () => {
  return process.env.CODESPACE_NAME 
    ? `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

// Generate Google OAuth URL
export function getGoogleOAuthURL(): string {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: `${getBaseUrl()}/api/auth/google/callback`,
    client_id: GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(' ')
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
}

// Get Google OAuth tokens
async function getGoogleOAuthTokens(code: string): Promise<any> {
  const url = 'https://oauth2.googleapis.com/token';
  const values = {
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: `${getBaseUrl()}/api/auth/google/callback`,
    grant_type: 'authorization_code'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(values)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google OAuth token error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error getting Google OAuth tokens:`, error);
    throw error;
  }
}

// Get Google user information
async function getGoogleUserInfo(access_token: string, id_token: string): Promise<any> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google user info error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error getting Google user info:`, error);
    throw error;
  }
}

// Handle Google callback
export async function handleGoogleCallback(code: string): Promise<{ token: string, newUser: boolean }> {
  try {
    console.log(`[${CURRENT_TIMESTAMP}] Processing Google OAuth callback`);
    
    // 1. Get OAuth tokens
    const { access_token, id_token } = await getGoogleOAuthTokens(code);
    
    if (!access_token) {
      throw new Error('Failed to get access token from Google');
    }
    
    // 2. Get user info from Google
    const googleUser = await getGoogleUserInfo(access_token, id_token);
    
    if (!googleUser.email) {
      throw new Error('Google did not return an email address');
    }
    
    console.log(`[${CURRENT_TIMESTAMP}] Retrieved Google user: ${googleUser.email}`);
    
    // 3. Connect to database
    await connectToDatabase();
    
    // 4. Check if user exists
    let user = await User.findOne({
      $or: [
        { googleId: googleUser.id },
        { email: googleUser.email }
      ]
    });
    
    let newUser = false;
    
    // 5. Create new user if doesn't exist
    if (!user) {
      newUser = true;
      
      // Create random secure password for account security
      const securePassword = randomUUID();
      
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        password: securePassword, // Will be hashed by the pre-save hook
        googleId: googleUser.id,
        authProvider: 'google',
        profilePicture: googleUser.picture,
        isVerified: true, // Google accounts are pre-verified
        isActive: true
      });
      
      console.log(`[${CURRENT_TIMESTAMP}] Created new Google user: ${user.email} (${user._id})`);
    } 
    // 6. Update existing user if needed
    else if (!user.googleId && googleUser.id) {
      // Link Google account to existing user
      user.googleId = googleUser.id;
      user.isVerified = true; // Mark email as verified
      
      // Update avatar if user doesn't have one
      if (!user.avatar && !user.profilePicture && googleUser.picture) {
        user.profilePicture = googleUser.picture;
      }
      
      // If this was previously a local account, update authProvider field
      if (!user.authProvider || user.authProvider === 'local') {
        user.authProvider = 'google';
      }
      
      await user.save();
      console.log(`[${CURRENT_TIMESTAMP}] Linked Google account to existing user: ${user.email} (${user._id})`);
    } else {
      console.log(`[${CURRENT_TIMESTAMP}] Existing Google user logged in: ${user.email} (${user._id})`);
    }
    
    // 7. Generate JWT token
    const token = generateAccessToken(user);
    
    return { token, newUser };
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error handling Google callback:`, error);
    throw error;
  }
}

/**
 * Generates a Facebook OAuth URL with proper handling for GitHub Codespaces
 */
export function getFacebookOAuthURL(): string {
  const CURRENT_TIMESTAMP = "2025-05-14 04:56:23";
  console.log(`[${CURRENT_TIMESTAMP}] Generating Facebook OAuth URL`);

  // Base Facebook OAuth URL
  const rootUrl = 'https://www.facebook.com/v16.0/dialog/oauth';
  
  // Determine base URL for the application
  // First check for GitHub Codespaces environment
  let baseUrl: string;
  if (process.env.CODESPACE_NAME) {
    baseUrl = `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`;
    console.log(`[${CURRENT_TIMESTAMP}] Using GitHub Codespaces URL: ${baseUrl}`);
  } else {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log(`[${CURRENT_TIMESTAMP}] Using standard URL: ${baseUrl}`);
  }
  
  // Ensure baseUrl doesn't have a trailing slash
  baseUrl = baseUrl.replace(/\/$/, '');
  
  // Construct the full redirect URI
  const redirectUri = `${baseUrl}/api/auth/facebook/callback`;
  console.log(`[${CURRENT_TIMESTAMP}] Facebook redirect URI: ${redirectUri}`);
  
  // Additional state parameter for security and tracking
  const state = Buffer.from(`${Date.now()}-${Math.random().toString(36).substring(2,15)}`).toString('base64');
  
  // Construct parameters for Facebook OAuth
  const options = {
    client_id: process.env.FACEBOOK_APP_ID || '',
    redirect_uri: redirectUri,
    scope: 'email,public_profile',
    response_type: 'code',
    auth_type: 'rerequest',
    display: 'popup',
    state
  };

  // Create the final URL
  const qs = new URLSearchParams(options);
  const finalUrl = `${rootUrl}?${qs.toString()}`;
  
  console.log(`[${CURRENT_TIMESTAMP}] Generated Facebook OAuth URL with parameters:`, { 
    client_id: process.env.FACEBOOK_APP_ID || '[REDACTED]',
    redirect_uri: redirectUri,
    state: state.substring(0, 10) + '...'
  });
  
  return finalUrl;
}

// Get Facebook OAuth tokens
async function getFacebookOAuthTokens(code: string): Promise<any> {
  try {
    const url = 'https://graph.facebook.com/v16.0/oauth/access_token';
    const params = new URLSearchParams({
      client_id: FACEBOOK_APP_ID,
      client_secret: FACEBOOK_APP_SECRET,
      redirect_uri: `${getBaseUrl()}/api/auth/facebook/callback`,
      code
    });

    const response = await fetch(`${url}?${params}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Facebook OAuth token error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error getting Facebook OAuth tokens:`, error);
    throw error;
  }
}

// Get Facebook user information
async function getFacebookUserInfo(access_token: string): Promise<any> {
  try {
    const fields = ['id', 'email', 'name', 'picture.type(large)'].join(',');
    const url = `https://graph.facebook.com/me?fields=${fields}&access_token=${access_token}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Facebook user info error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error getting Facebook user info:`, error);
    throw error;
  }
}

// Handle Facebook callback
export async function handleFacebookCallback(code: string): Promise<{ token: string, newUser: boolean }> {
  try {
    console.log(`[${CURRENT_TIMESTAMP}] Processing Facebook OAuth callback`);
    
    // 1. Get OAuth tokens
    const { access_token } = await getFacebookOAuthTokens(code);
    
    if (!access_token) {
      throw new Error('Failed to get access token from Facebook');
    }
    
    // 2. Get user info from Facebook
    const fbUser = await getFacebookUserInfo(access_token);
    
    if (!fbUser.email) {
      throw new Error('Facebook did not return an email address');
    }
    
    console.log(`[${CURRENT_TIMESTAMP}] Retrieved Facebook user: ${fbUser.email}`);
    
    // 3. Connect to database
    await connectToDatabase();
    
    // 4. Check if user exists
    let user = await User.findOne({
      $or: [
        { facebookId: fbUser.id },
        { email: fbUser.email }
      ]
    });
    
    let newUser = false;
    
    // 5. Create new user if doesn't exist
    if (!user) {
      newUser = true;
      
      // Create random secure password for account security
      const securePassword = randomUUID();
      
      user = await User.create({
        name: fbUser.name,
        email: fbUser.email,
        password: securePassword, // Will be hashed by the pre-save hook
        facebookId: fbUser.id,
        authProvider: 'facebook',
        profilePicture: fbUser.picture?.data?.url,
        isVerified: true, // Facebook accounts are pre-verified
        isActive: true
      });
      
      console.log(`[${CURRENT_TIMESTAMP}] Created new Facebook user: ${user.email} (${user._id})`);
    } 
    // 6. Update existing user if needed
    else if (!user.facebookId && fbUser.id) {
      // Link Facebook account to existing user
      user.facebookId = fbUser.id;
      user.isVerified = true; // Mark email as verified
      
      // Update avatar if user doesn't have one
      if (!user.avatar && !user.profilePicture && fbUser.picture?.data?.url) {
        user.profilePicture = fbUser.picture.data.url;
      }
      
      // If this was previously a local account, update authProvider field
      if (!user.authProvider || user.authProvider === 'local') {
        user.authProvider = 'facebook';
      }
      
      await user.save();
      console.log(`[${CURRENT_TIMESTAMP}] Linked Facebook account to existing user: ${user.email} (${user._id})`);
    } else {
      console.log(`[${CURRENT_TIMESTAMP}] Existing Facebook user logged in: ${user.email} (${user._id})`);
    }
    
    // 7. Generate JWT token
    const token = generateAccessToken(user);
    
    return { token, newUser };
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error handling Facebook callback:`, error);
    throw error;
  }
}