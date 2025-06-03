import { footballDataService } from '../services/FootballDataService';

// Update with your current timestamp
const CURRENT_TIMESTAMP = "2025-05-23 14:41:35"; 
const CURRENT_USER = "Sdiabate1337";

/**
 * Testing function for Football Data API
 */
export async function testFootballDataApi() {
  console.log(`[${CURRENT_TIMESTAMP}] Starting API test by ${CURRENT_USER}`);
  const results: Record<string, any> = {};
  const errors: Record<string, string> = {};
  
  try {
    // Test API connection
    console.log("Testing API connection...");
    const connectionTest = await footballDataService.testConnection();
    results.connection = connectionTest ? "SUCCESS" : "FAILED";
    
    if (!connectionTest) {
      throw new Error("API connection failed. Check your proxy API route and API key.");
    }
    
    // Test today's matches
    console.log("Fetching today's matches...");
    const todayMatches = await footballDataService.getTodayMatches();
    results.todayMatches = {
      count: todayMatches.total,
      sample: todayMatches.matches.slice(0, 2) // Just show first 2 for brevity
    };
    
    // Test live matches
    console.log("Fetching live matches...");
    const liveMatches = await footballDataService.getLiveMatches();
    results.liveMatches = {
      count: liveMatches.total,
      sample: liveMatches.matches.slice(0, 2) // Just show first 2 for brevity
    };
    
    // Test upcoming matches
    console.log("Fetching upcoming matches...");
    const upcomingMatches = await footballDataService.getUpcomingMatches();
    results.upcomingMatches = {
      count: upcomingMatches.total,
      sample: upcomingMatches.matches.slice(0, 2) // Just show first 2 for brevity
    };
    
    // Test competitions
    console.log("Fetching competitions...");
    const competitions = await footballDataService.getCompetitions();
    results.competitions = {
      count: competitions.count,
      sample: competitions.competitions.slice(0, 3) // Just show first 3 for brevity
    };
    
    // Test specific match if we have any
    if (todayMatches.matches.length > 0 || liveMatches.matches.length > 0 || upcomingMatches.matches.length > 0) {
      const matchId = 
        (liveMatches.matches[0]?.id || todayMatches.matches[0]?.id || upcomingMatches.matches[0]?.id);
      
      if (matchId) {
        console.log(`Fetching specific match (ID: ${matchId})...`);
        const match = await footballDataService.getMatch(matchId);
        results.specificMatch = match;
      }
    }
    
    console.log(`[${CURRENT_TIMESTAMP}] API test completed successfully`);
    return { success: true, results, errors };
    
  } catch (error: any) {
    console.error(`[${CURRENT_TIMESTAMP}] API test failed:`, error);
    return { 
      success: false, 
      results, 
      errors: { 
        message: error.message || "Unknown error occurred",
        stack: error.stack
      } 
    };
  }
}

// For browser console testing
if (typeof window !== 'undefined') {
  (window as any).testFootballDataApi = testFootballDataApi;
}