/**
 * Safe Supabase wrapper that prevents ALL "cannot read properties of undefined" errors
 * This wrapper ensures that every supabase method call is null-safe
 */
import { supabase as originalSupabase } from './supabase'

// Create a safe wrapper that handles null/undefined gracefully
const createSafeMethods = () => {
  const safeError = { error: new Error('Supabase client not configured') }
  
  return {
    // Auth methods
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      refreshSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signUp: () => Promise.resolve({ data: null, ...safeError }),
      signInWithPassword: () => Promise.resolve({ data: null, ...safeError }),
      signOut: () => Promise.resolve(safeError),
      updateUser: () => Promise.resolve({ data: null, ...safeError }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      admin: {
        listUsers: () => Promise.resolve({ data: null, ...safeError }),
        updateUserById: () => Promise.resolve({ data: null, ...safeError })
      }
    },
    
    // Database methods
    from: (table: string) => ({
      select: () => Promise.resolve({ data: null, ...safeError }),
      insert: () => Promise.resolve({ data: null, ...safeError }),
      update: () => Promise.resolve({ data: null, ...safeError }),
      delete: () => Promise.resolve({ data: null, ...safeError }),
      eq: function() { return this },
      neq: function() { return this },
      limit: function() { return this },
      order: function() { return this },
      single: function() { return this }
    }),
    
    // Storage methods
    storage: {
      from: (bucket: string) => ({
        upload: () => Promise.resolve(safeError),
        download: () => Promise.resolve({ data: null, ...safeError }),
        remove: () => Promise.resolve(safeError),
        list: () => Promise.resolve({ data: [], ...safeError }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  }
}

// Create the safe wrapper
export const supabase = originalSupabase || createSafeMethods()
export default supabase

// Helper to check if supabase is properly configured
export const hasValidSupabaseConfig = () => !!originalSupabase