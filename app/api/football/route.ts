import { NextResponse } from 'next/server';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-01 17:11:21";
const CURRENT_USER = "Sdiabate1337";

// Base URL for API-Football
const API_BASE_URL = 'https://api-football-v1.p.rapidapi.com/v3';

export async function GET(request: Request) {
  try {
    // Parse the URL to get query parameters
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    // Basic validation
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
    }

    // Create a new URLSearchParams without the endpoint and cache buster params
    const queryParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint' && !key.startsWith('_')) { // Skip cache busters (_cb, _t, _r)
        queryParams.append(key, value);
      }
    });
    
    // Get API key from environment variables
    const apiKey = process.env.API_FOOTBALL_KEY || process.env.NEXT_PUBLIC_API_FOOTBALL_KEY;
    const apiHost = process.env.API_FOOTBALL_HOST || 'api-football-v1.p.rapidapi.com';

    if (!apiKey) {
      console.error(`[${CURRENT_TIMESTAMP}] API key not configured`);
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Clean the endpoint (remove leading slash if present)
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    // Build the full URL
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/${cleanEndpoint}${queryString ? `?${queryString}` : ''}`;

    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Direct API request to: ${url}`);

    // Set timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // Make the request to the API with timeout
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHost,
          'User-Agent': 'Football Pro Dashboard/1.0',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        signal: controller.signal,
        cache: 'no-store' // Force fresh data with no caching
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - API response status: ${response.status}`);
      
      // Get rate limit info from headers
      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
      const rateLimitReset = response.headers.get('x-ratelimit-reset');
      
      if (rateLimitRemaining) {
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - API Rate limit remaining: ${rateLimitRemaining}`);
      }
      
      // Handle specific error responses
      if (!response.ok) {
        if (response.status === 429) {
          // Get retry-after from header or default to 60 seconds
          const retryAfter = response.headers.get('retry-after') || rateLimitReset || '60';
          
          console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Rate limit exceeded for ${endpoint}. Retry after ${retryAfter}s`);
          
          return NextResponse.json(
            { error: 'API rate limit exceeded. Please try again later.' },
            {
              status: 429,
              headers: {
                'Retry-After': retryAfter,
                'X-RateLimit-Reset': retryAfter
              }
            }
          );
        }
        
        return NextResponse.json(
          { error: `API returned error: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }
      
      // Get the response data
      const data = await response.json();
      
      // Return the data with rate limit headers and no-cache directives
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
          'X-RateLimit-Remaining': rateLimitRemaining || '0',
          'X-RateLimit-Reset': rateLimitReset || '0',
          'X-Direct-API-Call': 'true',
          'X-Timestamp': CURRENT_TIMESTAMP,
          'X-User': CURRENT_USER
        }
      });
    } catch (fetchError: any) {
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Handle abort errors (timeouts)
      if (fetchError.name === 'AbortError') {
        console.error(`[${CURRENT_TIMESTAMP}] Request timeout: ${url}`);
        return NextResponse.json({
          error: 'Request timeout. The API took too long to respond.',
          timestamp: CURRENT_TIMESTAMP
        }, { status: 504 });
      }
      
      // Handle network errors
      console.error(`[${CURRENT_TIMESTAMP}] Network error: ${fetchError.message}`);
      return NextResponse.json({
        error: `Network error: ${fetchError.message}`,
        timestamp: CURRENT_TIMESTAMP
      }, { status: 502 });
    }
  } catch (error: any) {
    console.error(`[${CURRENT_TIMESTAMP}] API proxy error:`, error);
    return NextResponse.json({
      error: 'Failed to fetch data from API',
      message: error.message || 'Unknown error',
      timestamp: CURRENT_TIMESTAMP
    }, { status: 500 });
  }
}