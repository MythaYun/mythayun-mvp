import { NextRequest, NextResponse } from 'next/server';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-20 16:38:47";
const CURRENT_USER = "Sdiabate1337";

export async function GET(request: NextRequest) {
  try {
    // Get the endpoint path from the query parameter
    const url = new URL(request.url);
    const endpoint = url.searchParams.get('endpoint');
    
    // Validate endpoint
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' }, 
        { status: 400 }
      );
    }
    
    // Remove the endpoint parameter and preserve the rest
    url.searchParams.delete('endpoint');
    const queryParams = url.searchParams.toString();
    
    // Get API key from environment variable
    const apiKey = process.env.NEXT_PUBLIC_FOOTBALL_DATA_API_KEY || 'your_api_key_here';
    
    // Log request (server-side)
    console.log(`[${CURRENT_TIMESTAMP}] Server proxy request: GET ${endpoint}${queryParams ? `?${queryParams}` : ''}`);
    
    // Make the request to the football-data API
    const apiUrl = `https://api.football-data.org/v4${endpoint}${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(apiUrl, {
      headers: {
        'X-Auth-Token': apiKey,
        'Accept': 'application/json'
      }
    });
    
    // Get response data
    const data = await response.json();
    
    // Return response with CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] API proxy error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch data from football API' }, 
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}