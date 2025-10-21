// "use client"

// import { createContext, useContext, useEffect, useState } from "react"
// import { createClient } from "@supabase/supabase-js"
// import type { User } from "@supabase/supabase-js"

// interface AuthContextType {
//   user: User | null
//   loading: boolean
//   signIn: (email: string, password: string) => Promise<{ error: string | null }>
//   signUp: (email: string, password: string, options?: { full_name?: string }) => Promise<{ error: string | null }>
//   signOut: () => Promise<void>
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined)

// // Create Supabase client
// function createSupabaseClient() {
//   const url = process.env.NEXT_PUBLIC_SUPABASE_URL
//   const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

//   if (!url || !key) {
//     console.error("❌ Supabase env vars missing")
//     return null
//   }

//   return createClient(url, key, {
//     auth: {
//       persistSession: true,
//       autoRefreshToken: true,
//       storage: typeof window !== 'undefined' ? window.localStorage : undefined,
//     },
//   })
// }

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [supabase] = useState(() => createSupabaseClient())

//   useEffect(() => {
//     if (!supabase) {
//       setLoading(false)
//       return
//     }

//     // Get initial session
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setUser(session?.user ?? null)
//       setLoading(false)
//     })

//     // Listen for changes
//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       setUser(session?.user ?? null)
//     })

//     return () => subscription.unsubscribe()
//   }, [supabase])

//   const signIn = async (email: string, password: string) => {
//     if (!supabase) return { error: "Auth not configured" }
//     const { error } = await supabase.auth.signInWithPassword({ email, password })
//     return { error: error?.message ?? null }
//   }

//   const signUp = async (email: string, password: string, options?: { full_name?: string }) => {
//     if (!supabase) return { error: "Auth not configured" }
//     const { error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: { data: { full_name: options?.full_name || "" } },
//     })
//     return { error: error?.message ?? null }
//   }

//   const signOut = async () => {
//     if (!supabase) return
//     await supabase.auth.signOut()
//     window.location.href = "/auth/login"
//   }

//   return (
//     <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
//       {children}
//     </AuthContext.Provider>
//   )
// }

// export function useAuth() {
//   const context = useContext(AuthContext)
//   if (!context) throw new Error("useAuth must be used within AuthProvider")
//   return context
// }

// // Create a stable supabase client that's guaranteed to work in browser
// let browserSupabase: ReturnType<typeof createSupabaseClient> | null = null

// export function getSupabaseClient() {
//   if (typeof window === 'undefined') return null
  
//   if (!browserSupabase) {
//     browserSupabase = createSupabaseClient()
//   }
  
//   return browserSupabase
// }

// // Export supabase for other components (backward compatibility)
// export const supabase = typeof window !== 'undefined' ? createSupabaseClient() : null

// // Hook to use supabase in components
// export function useSupabase() {
//   const [client, setClient] = useState<ReturnType<typeof createSupabaseClient> | null>(null)
  
//   useEffect(() => {
//     setClient(getSupabaseClient())
//   }, [])
  
//   return client
// }


// lib/auth.tsx
"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import type { User, SupabaseClient } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, options?: { full_name?: string }) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  supabase: SupabaseClient | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Creates a Supabase client optimized for browser use with SSR support
 * This ensures proper cookie handling between frontend and API routes
 */
function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error("❌ Supabase env vars missing")
    return null
  }

  // Use createBrowserClient for proper SSR cookie handling
  return createBrowserClient(url, key)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createSupabaseClient())

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    console.log("🔐 Initializing auth state...")

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("❌ Session error:", error)
      }
      console.log("📋 Initial session:", session ? `User: ${session.user.email}` : "No session")
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("🔄 Auth state changed:", _event, session ? `User: ${session.user.email}` : "No session")
      setUser(session?.user ?? null)
    })

    return () => {
      console.log("🧹 Cleaning up auth subscription")
      subscription.unsubscribe()
    }
  }, [supabase])

  /**
   * Signs in a user with email and password
   * Returns error message if sign-in fails
   */
  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: "Auth not configured" }
    
    console.log("🔑 Signing in user:", email)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      console.error("❌ Sign in error:", error.message)
    } else {
      console.log("✅ Sign in successful")
    }
    
    return { error: error?.message ?? null }
  }

  /**
   * Signs up a new user with email and password
   * Optionally includes full_name in user metadata
   */
  const signUp = async (email: string, password: string, options?: { full_name?: string }) => {
    if (!supabase) return { error: "Auth not configured" }
    
    console.log("📝 Signing up new user:", email)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: options?.full_name || "" } },
    })
    
    if (error) {
      console.error("❌ Sign up error:", error.message)
    } else {
      console.log("✅ Sign up successful")
    }
    
    return { error: error?.message ?? null }
  }

  /**
   * Signs out the current user
   * Clears session and redirects to login page
   */
  const signOut = async () => {
    if (!supabase) return
    
    console.log("👋 Signing out user")
    await supabase.auth.signOut()
    window.location.href = "/auth/login"
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, supabase }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}

// Stable singleton instance for the entire app
let browserSupabase: ReturnType<typeof createSupabaseClient> | null = null

/**
 * Gets or creates a stable Supabase client instance
 * Use this for direct Supabase operations outside of React components
 */
export function getSupabaseClient() {
  if (typeof window === 'undefined') return null
  
  if (!browserSupabase) {
    browserSupabase = createSupabaseClient()
  }
  
  return browserSupabase
}

// Export for backward compatibility (use getSupabaseClient() or useAuth().supabase instead)
export const supabase = typeof window !== 'undefined' ? createSupabaseClient() : null

/**
 * Hook to access Supabase client in React components
 * Prefer using useAuth().supabase instead for better consistency
 */
export function useSupabase() {
  const { supabase } = useAuth()
  return supabase
}
