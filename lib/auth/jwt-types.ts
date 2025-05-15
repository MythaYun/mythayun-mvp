import { SignOptions } from 'jsonwebtoken';

// Define JWT payload structure
export interface JwtPayload {
  userId: string;
  email?: string;
  name?: string;
  role?: string;
  tokenType?: 'access' | 'refresh';
  [key: string]: any; // Allow additional properties
}

// Export constants for JWT configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key-change-in-production';
export const JWT_ACCESS_EXPIRY_SECONDS = 60 * 60; // 1 hour
export const JWT_REFRESH_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days