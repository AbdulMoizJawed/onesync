/**
 * Simple in-memory rate limiter
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private cache = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if a request should be allowed
   * @param key - Unique identifier for the rate limit (e.g., IP, user ID, API endpoint)
   * @returns { allowed: boolean, remaining: number, resetTime: number }
   */
  check(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.cache.get(key);

    // If no entry exists or window has expired, create new entry
    if (!entry || now >= entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.config.windowMs,
      };
      this.cache.set(key, newEntry);
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    // Check if limit is exceeded
    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count and allow request
    entry.count++;
    this.cache.set(key, entry);

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.resetTime) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Get current status without incrementing
   */
  status(key: string): { count: number; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.cache.get(key);

    if (!entry || now >= entry.resetTime) {
      return {
        count: 0,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
      };
    }

    return {
      count: entry.count,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  }
}

// Create rate limiters for different purposes
export const generalApiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 100, // 100 requests per minute for general APIs
});

export const musoApiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 30, // 30 requests per minute for MUSO API
});

// Cleanup expired entries every 5 minutes
setInterval(() => {
  generalApiRateLimiter.cleanup();
  musoApiRateLimiter.cleanup();
}, 5 * 60 * 1000);

export { RateLimiter };
