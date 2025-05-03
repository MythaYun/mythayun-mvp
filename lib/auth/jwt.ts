import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { IUser } from '../models/User';

// JWT Payload type
export interface JwtPayload {
  userId: string;
  name: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'mythayun-jwt-secret-key';
const JWT_EXPIRY: string = process.env.JWT_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d'; // Longer-lived refresh token

/**
 * Generate access token
 * @param user User object to generate token for
 * @returns JWT token string
 */
export function generateAccessToken(user: IUser): string {
  const payload: JwtPayload = {
    userId: user._id!.toString(),
    name: user.name,
    email: user.email,
    role: user.role
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY as string });
}

/**
 * Generate refresh token with longer expiry
 * @param user User object to generate token for
 * @returns JWT refresh token string
 */
export function generateRefreshToken(user: IUser): string {
  const payload = {
    userId: user._id!.toString(),
    tokenType: 'refresh'
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });
}

/**
 * Verify JWT token
 * @param token Token to verify
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Set auth cookies in the response
 * @param accessToken Access token to set
 * @param refreshToken Refresh token to set
 */
export function setAuthCookies(accessToken: string, refreshToken: string): void {
  // Set HTTP-only, secure access token cookie
  cookies().set({
    name: 'accessToken',
    value: accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60, // 15 minutes in seconds
    path: '/'
  });
  
  // Set HTTP-only, secure refresh token cookie
  cookies().set({
    name: 'refreshToken',
    value: refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/'
  });
}

/**
 * Clear auth cookies
 */
export function clearAuthCookies(): void {
  cookies().set({
    name: 'accessToken',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  });
  
  cookies().set({
    name: 'refreshToken',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  });
}

/**
 * Get token from cookies
 * @returns Access token from cookie or undefined
 */
export function getAccessTokenFromCookies(): string | undefined {
  return cookies().get('accessToken')?.value;
}

/**
 * Get refresh token from cookies
 * @returns Refresh token from cookie or undefined
 */
export function getRefreshTokenFromCookies(): string | undefined {
  return cookies().get('refreshToken')?.value;
}