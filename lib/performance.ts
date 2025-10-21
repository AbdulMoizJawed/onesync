/**
 * Performance Monitoring and Optimization
 */

// Performance metrics tracking
export class PerformanceTracker {
  private static instance: PerformanceTracker
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker()
    }
    return PerformanceTracker.instance
  }

  // Track API call performance
  trackApiCall(endpoint: string, duration: number) {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, [])
    }
    this.metrics.get(endpoint)!.push(duration)
  }

  // Track component render performance
  trackComponentRender(componentName: string, duration: number) {
    const key = `component:${componentName}`
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    this.metrics.get(key)!.push(duration)
  }

  // Get performance statistics
  getStats(key: string) {
    const values = this.metrics.get(key) || []
    if (values.length === 0) return null

    const sorted = [...values].sort((a, b) => a - b)
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    }
  }

  // Get all metrics
  getAllStats() {
    const stats: Record<string, any> = {}
    for (const [key] of this.metrics) {
      stats[key] = this.getStats(key)
    }
    return stats
  }

  // Clear metrics
  clear() {
    this.metrics.clear()
  }

  // Log performance report to console (dev only)
  logReport() {
    if ((globalThis as any).process?.env?.NODE_ENV !== 'development') return
    
    const stats = this.getAllStats()
    console.group('🔥 Performance Report')
    
    Object.entries(stats).forEach(([key, stat]) => {
      if (stat) {
        console.log(`${key}: avg ${stat.avg.toFixed(2)}ms, p95 ${stat.p95.toFixed(2)}ms (${stat.count} samples)`)
      }
    })
    
    console.groupEnd()
  }
}

// Utility function to measure async operations
export async function measureAsync<T>(
  operation: () => Promise<T>,
  trackingKey: string
): Promise<T> {
  const start = performance.now()
  try {
    const result = await operation()
    const duration = performance.now() - start
    PerformanceTracker.getInstance().trackApiCall(trackingKey, duration)
    return result
  } catch (error) {
    const duration = performance.now() - start
    PerformanceTracker.getInstance().trackApiCall(`${trackingKey}:error`, duration)
    throw error
  }
}

// Hook for measuring component render performance
export function useMeasureRender(componentName: string) {
  if ((globalThis as any).process?.env?.NODE_ENV === 'development') {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      PerformanceTracker.getInstance().trackComponentRender(componentName, duration)
    }
  }
  return () => {} // No-op in production
}

// Image lazy loading utilities
export function createIntersectionObserver(callback: (entry: IntersectionObserverEntry) => void) {
  if (typeof window === 'undefined') return null
  
  return new IntersectionObserver(
    (entries) => {
      entries.forEach(callback)
    },
    {
      rootMargin: '50px',
      threshold: 0.1
    }
  )
}

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle utility for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Memory usage tracking (dev only)
export function trackMemoryUsage(label: string) {
  if ((globalThis as any).process?.env?.NODE_ENV !== 'development' || typeof window === 'undefined') return
  
  if ('memory' in performance) {
    const memory = (performance as any).memory
    console.log(`🧠 Memory Usage [${label}]:`, {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
    })
  }
}

// Bundle size analyzer
export function analyzeBundleImpact(moduleName: string) {
  if ((globalThis as any).process?.env?.NODE_ENV !== 'development') return
  
  const start = performance.now()
  return () => {
    const loadTime = performance.now() - start
    console.log(`📦 Module Load Time [${moduleName}]: ${loadTime.toFixed(2)}ms`)
  }
}

// Create performance-aware fetch wrapper
export async function performantFetch(
  url: string, 
  options?: RequestInit,
  timeout: number = 10000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await measureAsync(
      () => fetch(url, { 
        ...options, 
        signal: controller.signal 
      }),
      `api:${new URL(url).pathname}`
    )
    
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// Preload critical resources
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return
  
  // Preload critical fonts
  const fontPreloads = [
    '/fonts/inter-var.woff2'
  ]
  
  fontPreloads.forEach(font => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = font
    link.as = 'font'
    link.type = 'font/woff2'
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  })
  
  // Preload critical images
  const imagePreloads = [
    '/logo.png',
    '/placeholder-logo.svg'
  ]
  
  imagePreloads.forEach(image => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = image
    link.as = 'image'
    document.head.appendChild(link)
  })
}

// Initialize performance monitoring
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Log performance report every 30 seconds
  setInterval(() => {
    PerformanceTracker.getInstance().logReport()
  }, 30000)
  
  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      trackMemoryUsage('Page Hidden')
    } else {
      trackMemoryUsage('Page Visible')
    }
  })
}
