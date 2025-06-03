// Current system information
const CURRENT_TIMESTAMP = "2025-06-01 19:45:56";
const CURRENT_USER = "Sdiabate1337";

// Enhanced Cache System with additional features
class CacheService {
  private static cache: Record<string, { data: any; timestamp: number; ttl: number }> = {};
  
  // Default TTLs (in minutes)
  public static TTL = {
    SHORT: 5 * 60 * 1000,        // 5 minutes (live/frequently changing data)
    STANDARD: 30 * 60 * 1000,    // 30 minutes (most data)
    MEDIUM: 120 * 60 * 1000,     // 2 hours (semi-static data)
    LONG: 720 * 60 * 1000,       // 12 hours (static data)
    DAY: 1440 * 60 * 1000        // 24 hours (very static data)
  };
  
  // Check if we're in match hours (weekends or evenings on weekdays)
  static isMatchHours(): boolean {
    const now = new Date();
    const hour = now.getUTCHours();
    const day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
    
    // Weekend or weekday evening
    return (day === 0 || day === 6) || (hour >= 17 && hour <= 23);
  }
  
  // Get from cache or set if not exists
  static async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttlType: keyof typeof CacheService.TTL | number = 'STANDARD', 
    adjustForMatchHours: boolean = true
  ): Promise<T> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Cache check for: ${key}`);
    
    // Determine TTL in milliseconds
    let ttlMs: number;
    if (typeof ttlType === 'string') {
      ttlMs = this.TTL[ttlType];
      
      // During match hours, reduce cache time for dynamic data
      if (adjustForMatchHours && this.isMatchHours() && 
          (ttlType === 'SHORT' || ttlType === 'STANDARD')) {
        ttlMs = Math.max(60000, Math.floor(ttlMs / 3)); // Reduce to 1/3, min 1 minute
      }
    } else {
      // Direct minutes value
      ttlMs = ttlType * 60 * 1000;
    }
    
    // Check if data exists in cache and is still valid
    const cached = this.cache[key];
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < cached.ttl) {
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Cache hit for: ${key}`);
        return cached.data;
      }
      // Cache expired
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Cache expired for: ${key}`);
    }
    
    // Fetch fresh data
    try {
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Fetching fresh data for: ${key}`);
      const data = await fetchFn();
      
      // Store in cache
      this.cache[key] = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs
      };
      
      // Set cleanup timeout
      setTimeout(() => {
        delete this.cache[key];
      }, ttlMs);
      
      return data;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Error fetching data for: ${key}`, error);
      // If we have stale data, return it during errors
      if (cached) {
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Returning stale data during error for: ${key}`);
        return cached.data;
      }
      throw error;
    }
  }
  
  // Clear specific key or all cache
  static clear(key?: string): void {
    if (key) {
      delete this.cache[key];
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Cleared cache for: ${key}`);
    } else {
      this.cache = {};
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Cleared all cache`);
    }
  }
  
  // Invalidate cache for pattern (useful for related data)
  static invalidatePattern(pattern: string): void {
    const keys = Object.keys(this.cache);
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    matchingKeys.forEach(key => {
      delete this.cache[key];
    });
    
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Invalidated ${matchingKeys.length} cache entries matching: ${pattern}`);
  }
}

export default CacheService;