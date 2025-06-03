
class RequestQueue {
  private queue: Array<{
    execute: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = [];
  private processing = false;
  private lastRequestTime = 0;
  private minRequestInterval = 1100; // Minimum 1.1 seconds between requests
  private retryTimes: Record<string, number> = {}; // Track endpoints that need to wait

  async add<T>(endpoint: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if this endpoint is being rate limited
    const now = Date.now();
    if (this.retryTimes[endpoint] && now < this.retryTimes[endpoint]) {
      const waitTime = Math.ceil((this.retryTimes[endpoint] - now) / 1000);
      throw {
        status: 429,
        message: `Rate limit for endpoint ${endpoint}. Retry after ${waitTime} seconds.`,
        retryAfter: waitTime
      };
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: async () => {
          try {
            return await requestFn();
          } catch (error: any) {
            // If we get a rate limit error, remember when we can retry this endpoint
            if (error.status === 429 && error.retryAfter) {
              this.retryTimes[endpoint] = Date.now() + (error.retryAfter * 1000);
            }
            throw error;
          }
        },
        resolve,
        reject
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;

    // Ensure we wait enough time between requests
    const now = Date.now();
    const timeToWait = Math.max(0, this.lastRequestTime + this.minRequestInterval - now);
    
    if (timeToWait > 0) {
      await new Promise(resolve => setTimeout(resolve, timeToWait));
    }

    const request = this.queue.shift();
    if (!request) {
      this.processQueue();
      return;
    }

    try {
      this.lastRequestTime = Date.now();
      const result = await request.execute();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    } finally {
      // Continue processing the queue
      setTimeout(() => this.processQueue(), 100);
    }
  }
}

// Cache system with TTL
class CacheSystem {
  private cache: Record<string, { data: any; timestamp: number }> = {};
  private DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default
  
  get(key: string): any {
    const cached = this.cache[key];
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.DEFAULT_TTL) {
      // Cache expired
      delete this.cache[key];
      return null;
    }
    
    return cached.data;
  }
  
  set(key: string, data: any, ttl = this.DEFAULT_TTL): void {
    this.cache[key] = {
      data,
      timestamp: Date.now()
    };
    
    // Set auto-cleanup
    setTimeout(() => {
      delete this.cache[key];
    }, ttl);
  }
  
  clear(key?: string): void {
    if (key) {
      delete this.cache[key];
    } else {
      this.cache = {};
    }
  }
}

// Create singleton instances
const CURRENT_TIMESTAMP = new Date().toISOString();
const CURRENT_USER = typeof window !== 'undefined' && window.localStorage?.getItem('user')
  ? window.localStorage.getItem('user') || 'anonymous'
  : 'anonymous';
const requestQueue = new RequestQueue();
const cache = new CacheSystem();

// API Client
const apiFootballClient = {
  // Core request method with caching and rate limit handling
  async get(endpoint: string, params?: Record<string, any>, useCache: boolean = true) {
    // Create cache key
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
    
    const cacheKey = `${endpoint}?${queryString}`;
    
    // Check cache if enabled
    if (useCache) {
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Using cached data for: ${cacheKey}`);
        return cachedData;
      }
    }
    
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - API Request: GET ${endpoint}${queryString ? `?${queryString}` : ''}`);
    
    // Use request queue to handle rate limiting
    return requestQueue.add(endpoint, async () => {
      try {
        // Build API URL
        const proxyUrl = `/api/football?endpoint=${encodeURIComponent(endpoint)}${queryString ? `&${queryString}` : ''}`;
        
        // Set timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        try {
          const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'X-Requested-By': CURRENT_USER as string,
              'X-Timestamp': CURRENT_TIMESTAMP
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          // Get rate limit info from headers
          const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
          const rateLimitReset = response.headers.get('X-RateLimit-Reset');
          
          if (rateLimitRemaining) {
            console.log(`[${CURRENT_TIMESTAMP}] - Rate limit remaining: ${rateLimitRemaining}`);
          }
          
          if (!response.ok) {
            let errorDetails;
            try {
              errorDetails = await response.json();
            } catch (e) {
              errorDetails = { message: response.statusText };
            }
            
            // Specific handling for rate limits
            if (response.status === 429) {
              const retryAfter = response.headers.get('Retry-After') || rateLimitReset || '60';
              console.error(`[${CURRENT_TIMESTAMP}]  - Rate limit hit for ${endpoint}. Retry after ${retryAfter}s`);
              
              throw {
                status: 429,
                message: errorDetails?.message || 'Rate limit exceeded',
                retryAfter: parseInt(retryAfter, 10)
              };
            }
            
            throw {
              status: response.status,
              message: `API error (${response.status}): ${errorDetails?.message || response.statusText}`
            };
          }
          
          const data = await response.json();
          const result = { data };
          
          // Cache successful responses
          if (useCache) {
            cache.set(cacheKey, result);
          }
          
          return result;
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          
          if (fetchError.name === 'AbortError') {
            throw {
              status: 408,
              message: 'Request timeout. The API took too long to respond.'
            };
          }
          
          throw fetchError;
        }
      } catch (error: any) {
        console.error(`[${CURRENT_TIMESTAMP}] - API request error:`, error);
        throw error;
      }
    });
  },
  
  // Test connection with fallback
  async testConnection() {
    try {
      // Try a lightweight endpoint (countries)
      await this.get('countries', undefined, false);
      return true;
    } catch (error: any) {
      // If it's a rate limit, we still consider the API working
      if (error.status === 429) {
        return true;
      }
      return false;
    }
  },
  
  // Clear cache
  clearCache(endpoint?: string, params?: Record<string, any>) {
    if (endpoint) {
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
      
      const cacheKey = `${endpoint}?${queryString}`;
      cache.clear(cacheKey);
    } else {
      cache.clear();
    }
  },
  
  // Helper to format errors consistently
  formatError(error: any) {
    return {
      status: error?.status || 500,
      message: error?.message || 'Unknown error occurred',
      retryAfter: error?.retryAfter,
      timestamp: CURRENT_TIMESTAMP
    };
  },
  
  // API methods for leagues
  async getLeagues(params?: { id?: number, name?: string, country?: string, code?: string, season?: number, current?: boolean, search?: string, last?: number }) {
    return this.get('leagues', params);
  },
  
  async getStandings(params: { league: string | number, season: number }) {
    return this.get('standings', params);
  },
  
  async getFixtures(params: { id?: number, ids?: string, live?: string, date?: string, league?: string | number, season?: number, team?: number, last?: number, next?: number, from?: string, to?: string, round?: string, status?: string }) {
    return this.get('fixtures', params);
  },
  
  // Methods for live matches
  async getLiveFixtures(params?: { league?: string | number }) {
    return this.get('fixtures', { ...params, live: 'all' });
  },
  
  // Methods for fixture details
  async getFixtureStatistics(fixtureId: number) {
    return this.get('fixtures/statistics', { fixture: fixtureId });
  },
  
  async getFixtureEvents(fixtureId: number) {
    return this.get('fixtures/events', { fixture: fixtureId });
  },
  
  async getFixtureLineups(fixtureId: number) {
    return this.get('fixtures/lineups', { fixture: fixtureId });
  },
  
  // Methods for teams
  async getTeams(params: { id?: number, name?: string, league?: number, season?: number, search?: string, country?: string }) {
    return this.get('teams', params);
  },
  
  async getTeamStatistics(params: { team: number, league: number, season: number }) {
    return this.get('teams/statistics', params);
  },
  
  async getTeamFixtures(teamId: number, params?: { season?: number, next?: number, last?: number, from?: string, to?: string, status?: string, league?: number }) {
    return this.get('fixtures', { ...params, team: teamId });
  },
  
  // Methods for players
  async getPlayers(params: { id?: number, team?: number, league?: number, season: number, search?: string, page?: number }) {
    return this.get('players', params);
  },
  
  async getPlayerStatistics(playerId: number, season: number) {
    return this.get('players', { id: playerId, season });
  },
  
  // Methods for top scorers
  async getTopScorers(params: { league: number | string, season: number }) {
    return this.get('players/topscorers', params);
  },
  
  // Methods for countries
  async getCountries(params?: { name?: string, code?: string, search?: string }) {
    return this.get('countries', params);
  },
  
  // Methods for venue information
  async getVenues(params: { id?: number, name?: string, city?: string, country?: string }) {
    return this.get('venues', params);
  },
  
  // Methods for head-to-head comparisons
  async getHeadToHead(params: { h2h: string, from?: string, to?: string, league?: number, season?: number, last?: number }) {
    return this.get('fixtures/headtohead', params);
  },
  
  // Methods for transfer information
  async getTransfers(params: { player?: number, team?: number }) {
    return this.get('transfers', params);
  },
  
  // Methods for predictions
  async getPredictions(fixtureId: number) {
    return this.get('predictions', { fixture: fixtureId });
  },
  
  // Methods for odds
  async getOdds(params: { fixture?: number, league?: number, season?: number, date?: string, bookmaker?: number, bet?: number }) {
    return this.get('odds', params);
  },
  
  // Methods for injuries
  async getInjuries(params: { league?: number, team?: number, season: number, player?: number, fixture?: number }) {
    return this.get('injuries', params);
  }
};

export default apiFootballClient;