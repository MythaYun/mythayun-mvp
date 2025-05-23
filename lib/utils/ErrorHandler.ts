// Constants
const CURRENT_TIMESTAMP = "2025-05-19 18:09:41"; 
const CURRENT_USER = "Sdiabate1337";

interface ApiError {
  code: string;
  message: string;
  timestamp: string;
  status: number;
  path?: string;
  user?: string;
}

class ErrorHandler {
  static handleError(error: any): ApiError {
    const timestamp = CURRENT_TIMESTAMP;
    
    // Default error
    let apiError: ApiError = {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      timestamp,
      status: 500,
      user: CURRENT_USER
    };
    
    // Handle axios error
    if (error.response) {
      const { status, data, config } = error.response;
      
      apiError = {
        code: data.errors?.token || `HTTP_${status}`,
        message: data.errors?.message || 'An error occurred with the API request',
        timestamp,
        status,
        path: config.url,
        user: CURRENT_USER
      };
      
      // Handle specific API-Football errors
      if (status === 429) {
        apiError.code = 'RATE_LIMIT_EXCEEDED';
        apiError.message = 'Rate limit reached. API calls are limited.';
      } else if (status === 403) {
        apiError.code = 'UNAUTHORIZED';
        apiError.message = 'Your API subscription does not have access to this resource';
      } else if (data.errors && Object.keys(data.errors).length > 0) {
        // API-Football specific error handling
        apiError.message = Object.values(data.errors).join('. ');
      }
    } else if (error.request) {
      // Handle network error
      apiError = {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to the server. Please check your internet connection.',
        timestamp,
        status: 0,
        user: CURRENT_USER
      };
    }
    
    // Log all errors
    console.error(`[${timestamp}] ${CURRENT_USER} encountered ${apiError.code}: ${apiError.message}`);
    
    return apiError;
  }
  
  static getUserFriendlyMessage(error: ApiError): string {
    // Map error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      'RATE_LIMIT_EXCEEDED': 'We have reached our API request limit. Please try again later.',
      'NETWORK_ERROR': 'Unable to connect to our football data service. Please check your internet connection.',
      'UNAUTHORIZED': 'Your account doesn\'t have access to this content.',
      'NOT_FOUND': 'The requested football information could not be found.',
      'SUBSCRIPTION_EXPIRED': 'Our football data subscription needs to be renewed. Please contact support.'
    };
    
    return errorMessages[error.code] || 'Something went wrong loading the football data. Please try again.';
  }
}

export default ErrorHandler;