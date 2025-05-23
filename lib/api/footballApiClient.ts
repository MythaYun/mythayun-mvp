// Constants - move to environment variables for production
const API_KEY = process.env.NEXT_PUBLIC_FOOTBALL_DATA_API_KEY || 'your_api_key_here';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-20 16:38:47"; 
const CURRENT_USER = "Sdiabate1337";

// Create a fetch-based API client for football-data.org
const footballDataApiClient = {
  /**
   * Make a GET request to the API
   * @param url - The endpoint URL (without base URL)
   * @param params - Optional query parameters
   */
  async get(url: string, params?: Record<string, any>) {
    // Build query string from params
    const queryString = params 
      ? new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null) {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString()
      : '';
    
    // Log request
    console.log(`[${CURRENT_TIMESTAMP}] football-data.org API Request by ${CURRENT_USER}: GET ${url}${queryString ? `?${queryString}` : ''}`);
    
    try {
      // Check if API key is available
      if (!API_KEY || API_KEY === 'your_api_key_here') {
        throw new Error('API key is not configured. Please set the NEXT_PUBLIC_FOOTBALL_DATA_API_KEY environment variable.');
      }

      // Use our proxy API route instead of calling football-data.org directly
      const proxyUrl = `/api/football?endpoint=${encodeURIComponent(url)}${queryString ? `&${queryString}` : ''}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Handle error responses
      if (!response.ok) {
        // Try to get error details
        let errorDetails = null;
        try {
          errorDetails = await response.json();
        } catch (e) {
          // If parsing fails, use status text
          errorDetails = { message: response.statusText };
        }
        
        console.error(`[${CURRENT_TIMESTAMP}] football-data.org API Error (${response.status}) by ${CURRENT_USER}:`, errorDetails);
        
        throw {
          status: response.status,
          statusText: response.statusText,
          data: errorDetails,
          message: errorDetails?.message || `API error (${response.status}): ${response.statusText}`
        };
      }
      
      // Parse and return successful response
      const data = await response.json();
      return { data };  // Match previous response structure for compatibility
    } catch (error: any) {
      console.error(`[${CURRENT_TIMESTAMP}] football-data.org API Request Error by ${CURRENT_USER}:`, error);
      
      // Provide meaningful error messages
      if (error.message?.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection or try again later.');
      }
      
      // If error was thrown as an object with a message, use that
      if (error.message) {
        throw new Error(error.message);
      }
      
      throw error;
    }
  },
  
  /**
   * Helper to format API errors into a standard format
   * @param error - The error object caught from API request
   */
  formatError(error: any) {
    const status = error?.status || 500;
    let message = 'Unknown error occurred';
    
    // Extract message from different potential error formats
    if (typeof error === 'string') {
      message = error;
    } else if (error?.message) {
      message = error.message;
    } else if (error?.data?.message) {
      message = error.data.message;
    } else if (error?.statusText) {
      message = error.statusText;
    }
    
    return { 
      status, 
      message,
      timestamp: CURRENT_TIMESTAMP
    };
  },
  
  /**
   * Get API status - use this to test API connectivity
   */
  async testConnection() {
    try {
      // Use our proxy endpoint
      const response = await fetch('/api/football?endpoint=/status');
      return response.ok;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] API connection test failed:`, error);
      return false;
    }
  }
};

export default footballDataApiClient;