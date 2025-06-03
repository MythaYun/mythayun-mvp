import { NextResponse } from 'next/server';

// Current timestamp and user
const CURRENT_TIMESTAMP = "2025-05-24 13:15:19";
const CURRENT_USER = "Sdiabate1337";

export async function GET() {
  try {
    // Get API key from environment variable
    const apiKey = process.env.FOOTBALL_DATA_API_KEY || 'missing';
    
    // Log the first few characters of the key for debugging
    const keyPreview = apiKey === 'missing' ? 'MISSING KEY' : 
                       apiKey === 'your_api_key_here' ? 'USING DEFAULT STRING' :
                       `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
    
    console.log(`[${CURRENT_TIMESTAMP}] Testing API key: ${keyPreview}`);
    
    // Test against a simple endpoint
    const response = await fetch('https://api.football-data.org/v4/competitions', {
      headers: {
        'X-Auth-Token': apiKey,
        'Accept': 'application/json'
      }
    });
    
    // Get response status and headers
    const status = response.status;
    const headers = Object.fromEntries(response.headers.entries());
    
    // Check rate limit headers
    const rateLimit = {
      limit: headers['x-ratelimit-limit'] || 'unknown',
      remaining: headers['x-ratelimit-remaining'] || 'unknown',
      reset: headers['x-ratelimit-reset'] || 'unknown'
    };
    
    // Parse response data
    const data = await response.json();
    
    // Return diagnostic information
    return NextResponse.json({
      status: 'success',
      apiKeyPreview: keyPreview,
      httpStatus: status,
      rateLimits: rateLimit,
      competitions: data.competitions ? data.competitions.length : 0,
      plan: data.plan || 'unknown',
      filters: data.filters || {},
      timestamp: CURRENT_TIMESTAMP,
      user: CURRENT_USER
    });
    
  } catch (error: any) {
    console.error(`[${CURRENT_TIMESTAMP}] API test error:`, error);
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: CURRENT_TIMESTAMP,
      user: CURRENT_USER
    }, { status: 500 });
  }
}