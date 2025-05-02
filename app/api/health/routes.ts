import { NextResponse } from 'next/server';

export async function GET() {
  // Simple health check endpoint for CI/CD verification
  return NextResponse.json({
    status: 'ok',
    timestamp: '2025-05-02T11:30:00Z', // Current date/time
    version: process.env.VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
}