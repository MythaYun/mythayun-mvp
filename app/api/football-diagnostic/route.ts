import { NextResponse } from 'next/server';

export async function GET() {
  const CURRENT_TIMESTAMP = "2025-05-24 13:25:48";
  const CURRENT_USER = "Sdiabate1337";
  
  try {
    // Get API key
    const apiKey = process.env.FOOTBALL_DATA_API_KEY || 'missing';
    
    // Create diagnostic info
    const diagnosticInfo = {
      timestamp: CURRENT_TIMESTAMP,
      user: CURRENT_USER,
      apiKeyPrefix: apiKey.substring(0, 4) + '...',
      apiKeyLength: apiKey.length,
      tests: [] as any[]
    };
    
    // Test 1: Status endpoint
    try {
      console.log("Testing status endpoint...");
      const statusResponse = await fetch('https://api.football-data.org/v4/status', {
        headers: {
          'X-Auth-Token': apiKey
        }
      });
      
      const statusData = await statusResponse.text();
      diagnosticInfo.tests.push({
        name: "Status Endpoint",
        endpoint: "/status",
        status: statusResponse.status,
        headers: Object.fromEntries(statusResponse.headers.entries()),
        data: statusData.substring(0, 100) // Just show the first 100 chars
      });
    } catch (error: any) {
      diagnosticInfo.tests.push({
        name: "Status Endpoint",
        endpoint: "/status",
        error: error.message
      });
    }
    
    // Test 2: Areas endpoint (doesn't require auth)
    try {
      console.log("Testing areas endpoint...");
      const areasResponse = await fetch('https://api.football-data.org/v4/areas');
      
      const areasData = await areasResponse.json();
      diagnosticInfo.tests.push({
        name: "Areas Endpoint (No Auth)",
        endpoint: "/areas",
        status: areasResponse.status,
        headers: Object.fromEntries(areasResponse.headers.entries()),
        count: areasData.count || 0
      });
    } catch (error: any) {
      diagnosticInfo.tests.push({
        name: "Areas Endpoint",
        endpoint: "/areas",
        error: error.message
      });
    }
    
    // Test 3: Competitions endpoint with auth
    try {
      console.log("Testing competitions endpoint...");
      const competitionsResponse = await fetch('https://api.football-data.org/v4/competitions', {
        headers: {
          'X-Auth-Token': apiKey
        }
      });
      
      const competitionsText = await competitionsResponse.text();
      let competitionsData;
      try {
        competitionsData = JSON.parse(competitionsText);
      } catch (e) {
        competitionsData = { error: "Not valid JSON", text: competitionsText.substring(0, 100) };
      }
      
      diagnosticInfo.tests.push({
        name: "Competitions Endpoint",
        endpoint: "/competitions",
        status: competitionsResponse.status,
        headers: Object.fromEntries(competitionsResponse.headers.entries()),
        data: competitionsData.error ? competitionsData : { 
          count: competitionsData.count || 0,
          plan: competitionsData.plan || 'unknown'
        }
      });
    } catch (error: any) {
      diagnosticInfo.tests.push({
        name: "Competitions Endpoint",
        endpoint: "/competitions",
        error: error.message
      });
    }
    
    // Test 4: Matches endpoint with today's date
    const today = new Date().toISOString().split('T')[0];
    try {
      console.log(`Testing matches endpoint for ${today}...`);
      const matchesResponse = await fetch(`https://api.football-data.org/v4/matches?dateFrom=${today}&dateTo=${today}`, {
        headers: {
          'X-Auth-Token': apiKey
        }
      });
      
      const matchesText = await matchesResponse.text();
      let matchesData;
      try {
        matchesData = JSON.parse(matchesText);
      } catch (e) {
        matchesData = { error: "Not valid JSON", text: matchesText.substring(0, 100) };
      }
      
      diagnosticInfo.tests.push({
        name: "Today's Matches Endpoint",
        endpoint: `/matches?dateFrom=${today}&dateTo=${today}`,
        status: matchesResponse.status,
        headers: Object.fromEntries(matchesResponse.headers.entries()),
        data: matchesData.error ? matchesData : { 
          count: matchesData.count || 0,
          resultSet: matchesData.resultSet || {}
        }
      });
    } catch (error: any) {
      diagnosticInfo.tests.push({
        name: "Today's Matches Endpoint",
        endpoint: `/matches?dateFrom=${today}&dateTo=${today}`,
        error: error.message
      });
    }
    
    return NextResponse.json(diagnosticInfo);
    
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: CURRENT_TIMESTAMP
    }, { status: 500 });
  }
}