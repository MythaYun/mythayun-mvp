/**
 * Simple in-memory rate limiter implementation
 * Can be replaced with Redis or other distributed solutions for production at scale
 */
type RateLimitOptions = {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max number of unique tokens (e.g., IPs) per interval
};

type TokenBucket = {
  timestamp: number;
  count: number;
};

export function rateLimit(options: RateLimitOptions) {
  const { interval, uniqueTokenPerInterval } = options;
  const tokenCache = new Map<string, TokenBucket>();
  
  // Clean up expired tokens periodically
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [token, bucket] of tokenCache.entries()) {
      if (now - bucket.timestamp > interval) {
        tokenCache.delete(token);
      }
    }
    
    // If cache grows too large, remove oldest entries
    if (tokenCache.size > uniqueTokenPerInterval) {
      let oldest: string | null = null;
      let oldestTime = Infinity;
      
      for (const [token, bucket] of tokenCache.entries()) {
        if (bucket.timestamp < oldestTime) {
          oldestTime = bucket.timestamp;
          oldest = token;
        }
      }
      
      if (oldest) tokenCache.delete(oldest);
    }
  }, interval);
  
  // Ensure cleanup runs even in serverless environments
  if (cleanup.unref) {
    cleanup.unref();
  }
  
  return {
    /**
     * Check if request is within rate limit
     * @param limit - Max requests allowed within interval
     * @param token - Unique identifier (usually IP address)
     * @returns Promise that resolves if within limits, rejects if exceeds
     */
    check: (limit: number, token: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const now = Date.now();
        
        // Initialize or get existing bucket for this token
        const bucket = tokenCache.get(token) || {
          timestamp: now,
          count: 0,
        };
        
        // If bucket is expired, reset count
        if (now - bucket.timestamp > interval) {
          bucket.timestamp = now;
          bucket.count = 0;
        }
        
        // Increment counter
        bucket.count++;
        tokenCache.set(token, bucket);
        
        // Log for debugging
        console.log(`[${new Date().toISOString()}] Rate limiting: Token ${token} - Count ${bucket.count}/${limit}`);
        
        // Check if exceeds limit
        if (bucket.count > limit) {
          const retryAfterSeconds = Math.ceil((bucket.timestamp + interval - now) / 1000);
          reject({
            status: 429,
            message: 'Too Many Requests',
            retryAfter: retryAfterSeconds,
          });
        } else {
          resolve();
        }
      });
    },
    
    /**
     * Reset rate limit counter for a specific token
     * Useful after successful login to allow immediate retries
     */
    reset: (token: string): void => {
      tokenCache.delete(token);
    }
  };
}