/**
 * Database Query Optimization Utilities
 */

// Cache implementation for static data
class QueryCache {
  private cache = new Map<string, { data: any; expiry: number }>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set(key: string, data: any, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, { data, expiry })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

export const queryCache = new QueryCache()

// Database query optimization helpers
export const optimizedQueries = {
  // Forum queries with proper indexing
  getForumPosts: (limit = 20, offset = 0) => ({
    select: `
      id, title, content, created_at, updated_at, user_id, category_id,
      profiles!user_id(id, username, full_name, avatar_url),
      forum_categories!category_id(id, name, color)
    `,
    limit,
    offset,
    order: { created_at: { ascending: false } }
  }),

  // Artist search with optimization
  searchArtists: (searchTerm: string, limit = 10) => ({
    select: 'id, name, genre, location, avatar_url, created_at',
    ilike: { name: `%${searchTerm}%` },
    limit,
    order: { created_at: { ascending: false } }
  }),

  // Analytics queries with date ranges
  getAnalytics: (userId: string, startDate: string, endDate: string) => ({
    select: 'platform, streams, revenue, date',
    eq: { user_id: userId },
    gte: { date: startDate },
    lte: { date: endDate },
    order: { date: { ascending: false } }
  })
}

// Index suggestions for better performance
export const suggestedIndexes = {
  forum_posts: [
    'CREATE INDEX IF NOT EXISTS idx_forum_posts_user_created ON forum_posts(user_id, created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_forum_posts_category_created ON forum_posts(category_id, created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_forum_posts_title_search ON forum_posts USING gin(to_tsvector(\'english\', title))'
  ],
  forum_comments: [
    'CREATE INDEX IF NOT EXISTS idx_forum_comments_post_created ON forum_comments(post_id, created_at ASC)',
    'CREATE INDEX IF NOT EXISTS idx_forum_comments_user_created ON forum_comments(user_id, created_at DESC)'
  ],
  artists: [
    'CREATE INDEX IF NOT EXISTS idx_artists_name_search ON artists USING gin(to_tsvector(\'english\', name))',
    'CREATE INDEX IF NOT EXISTS idx_artists_genre ON artists(genre)',
    'CREATE INDEX IF NOT EXISTS idx_artists_user_status ON artists(user_id, status)'
  ],
  releases: [
    'CREATE INDEX IF NOT EXISTS idx_releases_user_status ON releases(user_id, status)',
    'CREATE INDEX IF NOT EXISTS idx_releases_created_at ON releases(created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_releases_release_date ON releases(release_date DESC)'
  ],
  analytics: [
    'CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON analytics(user_id, date DESC)',
    'CREATE INDEX IF NOT EXISTS idx_analytics_platform_date ON analytics(platform, date DESC)',
    'CREATE INDEX IF NOT EXISTS idx_analytics_date_revenue ON analytics(date DESC, revenue DESC)'
  ]
}

// Query performance monitor
export class QueryPerformanceMonitor {
  private queries: Array<{
    query: string
    duration: number
    timestamp: number
    table?: string
  }> = []

  logQuery(query: string, duration: number, table?: string): void {
    this.queries.push({
      query,
      duration,
      timestamp: Date.now(),
      table
    })

    // Keep only last 100 queries
    if (this.queries.length > 100) {
      this.queries = this.queries.slice(-100)
    }

    // Log slow queries in development
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`🐌 Slow query detected (${duration}ms):`, query.substring(0, 100))
    }
  }

  getSlowQueries(threshold = 500): Array<{
    query: string
    duration: number
    table?: string
  }> {
    return this.queries
      .filter(q => q.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
  }

  getQueryStats(): {
    total: number
    averageDuration: number
    slowestQuery: { query: string; duration: number } | null
    tableStats: Record<string, { count: number; avgDuration: number }>
  } {
    if (this.queries.length === 0) {
      return {
        total: 0,
        averageDuration: 0,
        slowestQuery: null,
        tableStats: {}
      }
    }

    const total = this.queries.length
    const averageDuration = this.queries.reduce((sum, q) => sum + q.duration, 0) / total
    const slowestQuery = this.queries.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest
    )

    // Table statistics
    const tableStats: Record<string, { count: number; avgDuration: number }> = {}
    this.queries.forEach(query => {
      const table = query.table || 'unknown'
      if (!tableStats[table]) {
        tableStats[table] = { count: 0, avgDuration: 0 }
      }
      tableStats[table].count++
    })

    // Calculate average durations for each table
    Object.keys(tableStats).forEach(table => {
      const tableQueries = this.queries.filter(q => (q.table || 'unknown') === table)
      tableStats[table].avgDuration = 
        tableQueries.reduce((sum, q) => sum + q.duration, 0) / tableQueries.length
    })

    return {
      total,
      averageDuration,
      slowestQuery: { query: slowestQuery.query, duration: slowestQuery.duration },
      tableStats
    }
  }

  clear(): void {
    this.queries = []
  }
}

export const queryMonitor = new QueryPerformanceMonitor()

// Optimized Supabase client wrapper
export function createOptimizedSupabaseWrapper(supabase: any) {
  // If supabase is null or undefined, return a safe mock object
  if (!supabase) {
    console.warn('⚠️ Supabase client not available - using mock wrapper')
    return {
      from: (table: string) => ({
        select: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        update: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        delete: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
      }),
      auth: null,
      storage: null,
      channel: () => null,
      removeChannel: () => null,
      removeAllChannels: () => null
    }
  }

  return {
    from: (table: string) => {
      const originalFrom = supabase.from(table)
      
      // Wrap select method to add performance monitoring
      const originalSelect = originalFrom.select
      if (originalSelect) {
        originalFrom.select = function(columns?: string) {
          const startTime = performance.now()
          const result = originalSelect.call(this, columns)
          
          // Monitor the query when it's executed
          const originalThen = result?.then
          if (originalThen) {
            result.then = function(onFulfilled: any, onRejected: any) {
              return originalThen.call(this, (data: any) => {
                const duration = performance.now() - startTime
                queryMonitor.logQuery(`SELECT ${columns || '*'} FROM ${table}`, duration, table)
                return onFulfilled ? onFulfilled(data) : data
              }, onRejected)
            }
          }
          
          return result
        }
      }
      
      return originalFrom
    },
    
    // Pass through other methods with null checks
    auth: supabase.auth,
    storage: supabase.storage,
    channel: supabase.channel ? supabase.channel.bind(supabase) : () => null,
    removeChannel: supabase.removeChannel ? supabase.removeChannel.bind(supabase) : () => null,
    removeAllChannels: supabase.removeAllChannels ? supabase.removeAllChannels.bind(supabase) : () => null
  }
}

// Connection pool simulation for better performance
export class ConnectionPool {
  private connections: Array<{
    id: string
    inUse: boolean
    lastUsed: number
  }> = []
  
  private maxConnections = 10
  private connectionTimeout = 30000 // 30 seconds

  getConnection(): string {
    // Find available connection
    let connection = this.connections.find(conn => !conn.inUse)
    
    if (!connection) {
      // Create new connection if under limit
      if (this.connections.length < this.maxConnections) {
        connection = {
          id: Math.random().toString(36).substr(2, 9),
          inUse: false,
          lastUsed: Date.now()
        }
        this.connections.push(connection)
      } else {
        // Reuse oldest connection
        connection = this.connections.reduce((oldest, current) => 
          current.lastUsed < oldest.lastUsed ? current : oldest
        )
      }
    }
    
    connection.inUse = true
    connection.lastUsed = Date.now()
    
    return connection.id
  }
  
  releaseConnection(id: string): void {
    const connection = this.connections.find(conn => conn.id === id)
    if (connection) {
      connection.inUse = false
      connection.lastUsed = Date.now()
    }
  }
  
  cleanup(): void {
    const now = Date.now()
    this.connections = this.connections.filter(
      conn => !conn.inUse && (now - conn.lastUsed) < this.connectionTimeout
    )
  }
  
  getStats(): {
    total: number
    inUse: number
    available: number
  } {
    const inUse = this.connections.filter(conn => conn.inUse).length
    return {
      total: this.connections.length,
      inUse,
      available: this.connections.length - inUse
    }
  }
}

export const connectionPool = new ConnectionPool()

// Auto-cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    connectionPool.cleanup()
  }, 5 * 60 * 1000)
}
