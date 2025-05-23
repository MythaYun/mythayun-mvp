/**
 * CacheService for API-Football Integration
 * 
 * Manages caching of API responses to reduce API calls and respect rate limits.
 * Implements expiry times for different types of data.
 */

// Constants
const CURRENT_TIMESTAMP = "2025-05-19 18:28:09";
const CURRENT_USER = "Sdiabate1337";

interface CacheItem<T> {
  data: T;
  expiry: number;
  timestamp: string;
  user: string;
  key: string;
}

class CacheService {
  private cache: Map<string, CacheItem<any>>;
  private readonly MAX_CACHE_SIZE = 500; // Prevent excessive memory usage
  
  constructor() {
    this.cache = new Map();
    console.log(`[${CURRENT_TIMESTAMP}] CacheService initialized for user ${CURRENT_USER}`);
  }
  
  /**
   * Set an item in the cache with an expiry time
   * @param key Unique cache key
   * @param data Data to cache
   * @param expiryMinutes Minutes until item expires (defaults to 5)
   * @param category Optional category for logging/grouping
   */
  set<T>(key: string, data: T, expiryMinutes: number = 5, category?: string): void {
    // Check if we need to clear space
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.clearOldest();
    }
    
    const now = new Date(CURRENT_TIMESTAMP);
    const expiry = now.getTime() + (expiryMinutes * 60 * 1000);
    
    this.cache.set(key, {
      data,
      expiry,
      timestamp: CURRENT_TIMESTAMP,
      user: CURRENT_USER,
      key
    });
    
    const categoryStr = category ? `[${category}] ` : '';
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} cached ${categoryStr}data for key: ${key}, expires in ${expiryMinutes} minutes`);
  }
  
  /**
   * Get an item from the cache if it exists and hasn't expired
   * @param key Cache key to retrieve
   * @returns Cached data or null if not found or expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    const now = new Date(CURRENT_TIMESTAMP).getTime();
    
    // Return null if item doesn't exist
    if (!item) {
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} cache miss for key: ${key}`);
      return null;
    }
    
    // Return null if item has expired and remove it
    if (now > item.expiry) {
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} cache expired for key: ${key} (set ${this.getTimeAgo(item.timestamp)})`);
      this.cache.delete(key);
      return null;
    }
    
    // Calculate remaining validity in minutes
    const remainingMinutes = Math.ceil((item.expiry - now) / (60 * 1000));
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} cache hit for key: ${key} (valid for ${remainingMinutes} more minutes)`);
    
    return item.data as T;
  }
  
  /**
   * Remove a specific item from the cache
   * @param key Cache key to remove
   */
  remove(key: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} removed cache for key: ${key}`);
    }
  }
  
  /**
   * Clear all items from the cache
   */
  clear(): void {
    const count = this.cache.size;
    this.cache.clear();
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} cleared entire cache (${count} items)`);
  }
  
  /**
   * Clear items by category prefix
   * @param categoryPrefix Prefix to match for clearing
   */
  clearByCategory(categoryPrefix: string): void {
    let count = 0;
    
    this.cache.forEach((_, key) => {
      if (key.startsWith(categoryPrefix)) {
        this.cache.delete(key);
        count++;
      }
    });
    
    if (count > 0) {
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} cleared ${count} items from category: ${categoryPrefix}`);
    }
  }
  
  /**
   * Clear expired items from the cache
   * @returns Number of items cleared
   */
  clearExpired(): number {
    const now = new Date(CURRENT_TIMESTAMP).getTime();
    let count = 0;
    
    this.cache.forEach((item, key) => {
      if (now > item.expiry) {
        this.cache.delete(key);
        count++;
      }
    });
    
    if (count > 0) {
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} cleared ${count} expired items from cache`);
    }
    
    return count;
  }
  
  /**
   * Get cache statistics
   */
  getStats(): { size: number, categories: Record<string, number> } {
    const categories: Record<string, number> = {};
    
    this.cache.forEach((_, key) => {
      // Extract category from key format "category-restofkey"
      const category = key.split('-')[0];
      if (category) {
        categories[category] = (categories[category] || 0) + 1;
      }
    });
    
    return {
      size: this.cache.size,
      categories
    };
  }
  
  /**
   * Internal: Clear oldest items when cache gets too large
   */
  private clearOldest(): void {
    // Convert to array for sorting
    const items = Array.from(this.cache.entries());
    
    // Sort by expiry (oldest first)
    items.sort((a, b) => a[1].expiry - b[1].expiry);
    
    // Remove the oldest 10% or at least 1 item
    const removeCount = Math.max(1, Math.floor(items.length * 0.1));
    
    for (let i = 0; i < removeCount; i++) {
      if (i < items.length) {
        this.cache.delete(items[i][0]);
      }
    }
    
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} cleared ${removeCount} oldest items to make space in cache`);
  }
  
  /**
   * Get how long ago a timestamp was (for logging)
   */
  private getTimeAgo(timestamp: string): string {
    const then = new Date(timestamp).getTime();
    const now = new Date(CURRENT_TIMESTAMP).getTime();
    const seconds = Math.floor((now - then) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }
}

/**
 * Helper functions to standardize cache keys for different data types
 */
export const createCacheKey = {
  match: (matchId: string) => `match-${matchId}`,
  todayMatches: () => `matches-today`,
  liveMatches: () => `matches-live`,
  upcomingMatches: (days: number) => `matches-upcoming-${days}`,
  teamMatches: (teamId: string) => `team-${teamId}-matches`,
  team: (teamId: string) => `team-${teamId}`,
  teamSquad: (teamId: string) => `team-${teamId}-squad`,
  league: (leagueId: string) => `league-${leagueId}`,
  leagueTeams: (leagueId: string, season: number) => `league-${leagueId}-teams-${season}`,
  search: (type: string, query: string) => `search-${type}-${query}`
};

// Create a singleton instance
const cacheService = new CacheService();
export default cacheService;