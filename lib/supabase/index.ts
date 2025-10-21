// Bridge file so imports of '@/lib/supabase' (from both root and admin code) work.
// If admin code expects BUCKET_NAME and a browser supabase client, replicate minimal API.
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Bucket name may be optional in some flows; only warn if absent.
export const BUCKET_NAME = process.env.NEXT_PUBLIC_BUCKET_NAME || ''

// Custom storage implementation to ensure persistence
const customStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null
    try {
      return window.localStorage.getItem(key)
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return null
    }
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, value)
      console.log(`✅ Session saved to localStorage: ${key}`)
    } catch (error) {
      console.error('Error writing to localStorage:', error)
    }
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(key)
      console.log(`🗑️ Session removed from localStorage: ${key}`)
    } catch (error) {
      console.error('Error removing from localStorage:', error)
    }
  },
}

// Create supabase client safely with fallback
let supabaseClient: SupabaseClient | null = null

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    if (typeof window !== 'undefined') {
      console.warn('⚠️ Supabase environment variables not configured')
    }
    supabaseClient = null
  } else {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,       // Persist session in localStorage
        autoRefreshToken: true,      // Auto-refresh token before expiry
        detectSessionInUrl: true,    // Detect OAuth sessions from URL
        flowType: 'pkce',           // Back to PKCE for better security
        // debug: process.env.NODE_ENV === 'development', // Enable debug logs in dev
        debug: false,
        storage: customStorage,      // Use custom storage with logging
        storageKey: 'sb-auth-token', // Use consistent storage key
        // Note: JWT expiry is set server-side in Supabase Dashboard
        // Default is 3600 seconds (1 hour), we want 1200 seconds (20 minutes)
        // This needs to be configured in Supabase Dashboard → Authentication → Settings
        // Under "JWT Expiry" set to 1200 seconds
      },
      global: {
        headers: {
          'X-Client-Info': 'onesync-web-app',
        },
      },
      // Retry failed requests to prevent session loss from network issues
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
    
    if (typeof window !== 'undefined') {
      console.log('✅ Supabase client created successfully')
    }
  }
} catch (error) {
  if (typeof window !== 'undefined') {
    console.error('Failed to create Supabase client:', error)
  }
  supabaseClient = null
}

export const supabase = supabaseClient

// Helper to check if Supabase is configured
export function hasValidSupabaseConfig(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Re-export admin helper for server contexts
export { createAdminClient } from './admin'
