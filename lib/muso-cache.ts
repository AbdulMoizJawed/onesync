/**
 * MUSO API Cache Layer
 * Provides caching functionality for MUSO API calls to reduce API usage and improve performance
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number // Default TTL in milliseconds
  maxSize?: number // Maximum number of entries in memory cache
  useLocalStorage?: boolean // Whether to persist cache to localStorage
  storagePrefix?: string // Prefix for localStorage keys
}

class MusoAPICache {
  private memoryCache = new Map<string, CacheEntry<any>>()
  private options: Required<CacheOptions>
  
  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 15 * 60 * 1000, // Default 15 minutes
      maxSize: options.maxSize || 1000, // Default max 1000 entries
      useLocalStorage: options.useLocalStorage ?? true,
      storagePrefix: options.storagePrefix || 'muso_cache_'
    }
    
    // Clean up expired entries on initialization
    this.cleanup()
    
    // Set up periodic cleanup every 5 minutes
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 5 * 60 * 1000)
    }
  }

  /**
   * Generate a cache key from parameters
   */
  private generateKey(endpoint: string, params?: any): string {
    const paramsStr = params ? JSON.stringify(params) : ''
    return `${endpoint}_${paramsStr}`
  }

  /**
   * Check if a cache entry is still valid
   */
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  /**
   * Get data from cache
   */
  get<T>(endpoint: string, params?: any): T | null {
    const key = this.generateKey(endpoint, params)
    
    // Try memory cache first
    const memoryEntry = this.memoryCache.get(key)
    if (memoryEntry && this.isValid(memoryEntry)) {
      console.log(`🎯 MUSO Cache HIT (memory): ${key}`)
      return memoryEntry.data
    }

    // Try localStorage if enabled
    if (this.options.useLocalStorage && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.options.storagePrefix + key)
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored)
          if (this.isValid(entry)) {
            // Restore to memory cache
            this.memoryCache.set(key, entry)
            console.log(`🎯 MUSO Cache HIT (localStorage): ${key}`)
            return entry.data
          } else {
            // Remove expired entry
            localStorage.removeItem(this.options.storagePrefix + key)
          }
        }
      } catch (error) {
        console.warn('Failed to read from localStorage cache:', error)
      }
    }

    console.log(`❌ MUSO Cache MISS: ${key}`)
    return null
  }

  /**
   * Store data in cache
   */
  set<T>(endpoint: string, data: T, params?: any, customTtl?: number): void {
    const key = this.generateKey(endpoint, params)
    const ttl = customTtl || this.options.ttl
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    }

    // Store in memory cache
    this.memoryCache.set(key, entry)
    console.log(`💾 MUSO Cache SET (memory): ${key} [TTL: ${ttl}ms]`)

    // Enforce max size
    if (this.memoryCache.size > this.options.maxSize) {
      const firstKey = this.memoryCache.keys().next().value
      if (firstKey) {
        this.memoryCache.delete(firstKey)
      }
    }

    // Store in localStorage if enabled
    if (this.options.useLocalStorage && typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          this.options.storagePrefix + key,
          JSON.stringify(entry)
        )
        console.log(`💾 MUSO Cache SET (localStorage): ${key}`)
      } catch (error) {
        console.warn('Failed to write to localStorage cache:', error)
      }
    }
  }

  /**
   * Remove specific entry from cache
   */
  delete(endpoint: string, params?: any): void {
    const key = this.generateKey(endpoint, params)
    
    this.memoryCache.delete(key)
    
    if (this.options.useLocalStorage && typeof window !== 'undefined') {
      localStorage.removeItem(this.options.storagePrefix + key)
    }
    
    console.log(`🗑️ MUSO Cache DELETE: ${key}`)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.memoryCache.clear()
    
    if (this.options.useLocalStorage && typeof window !== 'undefined') {
      // Remove all localStorage entries with our prefix
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.options.storagePrefix)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
    
    console.log('🧹 MUSO Cache CLEARED')
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    let removedCount = 0
    
    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValid(entry)) {
        this.memoryCache.delete(key)
        removedCount++
      }
    }

    // Clean localStorage cache
    if (this.options.useLocalStorage && typeof window !== 'undefined') {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.options.storagePrefix)) {
          try {
            const stored = localStorage.getItem(key)
            if (stored) {
              const entry: CacheEntry<any> = JSON.parse(stored)
              if (!this.isValid(entry)) {
                keysToRemove.push(key)
              }
            }
          } catch (error) {
            // Remove invalid entries
            keysToRemove.push(key)
          }
        }
      }
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        removedCount++
      })
    }

    if (removedCount > 0) {
      console.log(`🧹 MUSO Cache cleanup: removed ${removedCount} expired entries`)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memorySize: number
    localStorageSize: number
    totalSize: number
  } {
    let localStorageSize = 0
    
    if (this.options.useLocalStorage && typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.options.storagePrefix)) {
          localStorageSize++
        }
      }
    }

    return {
      memorySize: this.memoryCache.size,
      localStorageSize,
      totalSize: this.memoryCache.size + localStorageSize
    }
  }

  /**
   * Wrapper function to cache API calls
   */
  async cached<T>(
    endpoint: string,
    apiCall: () => Promise<T>,
    params?: any,
    customTtl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(endpoint, params)
    if (cached !== null) {
      return cached
    }

    // Make API call and cache result
    try {
      console.log(`🌐 MUSO API Call: ${endpoint}`)
      const result = await apiCall()
      this.set(endpoint, result, params, customTtl)
      return result
    } catch (error) {
      console.error(`❌ MUSO API Error: ${endpoint}`, error)
      throw error
    }
  }
}

// Export singleton instance with default configuration
export const musoCache = new MusoAPICache({
  ttl: 15 * 60 * 1000, // 15 minutes for most data
  maxSize: 1000,
  useLocalStorage: false, // Disabled to prevent auth session conflicts
  storagePrefix: 'muso_cache_'
})

// Export different TTL configurations
export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000,      // 5 minutes - for frequently changing data
  MEDIUM: 15 * 60 * 1000,    // 15 minutes - default
  LONG: 60 * 60 * 1000,      // 1 hour - for stable data like profiles
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours - for very stable data
} as const

export { MusoAPICache }
