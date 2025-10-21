"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, options?: { full_name?: string }) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create Supabase client - BROWSER ONLY
let supabase: any = null

// Function to get or create Supabase client
function getSupabase() {
  if (supabase) return supabase
  
  if (typeof window === 'undefined') {
    console.log("⚠️ Server-side render, skipping Supabase client creation")
    return null
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase environment variables")
    return null
  }

  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'sb-auth-token',
      flowType: 'pkce',
    },
  })
  
  console.log("✅ Supabase client created in browser with localStorage")
  return supabase
}

// Initialize on first import if in browser
if (typeof window !== 'undefined') {
  supabase = getSupabase()
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = getSupabase()
    
    if (!client) {
      console.error("❌ No Supabase client available")
      setLoading(false)
      return
    }

    // Get initial session
    client.auth.getSession().then(({ data: { session } }: any) => {
      console.log("📡 Initial session check:", session?.user?.email || 'no session')
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event: string, session: any) => {
      console.log("🔔 Auth event:", _event, session?.user?.email || 'no user')
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const client = getSupabase()
    if (!client) return { error: "Auth not configured" }

    console.log("🔐 Attempting login for:", email)
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    
    if (error) {
      console.error("❌ Login error:", error)
      return { error: error.message }
    }
    
    console.log("✅ Login successful! Session:", {
      user: data.user?.email,
      hasAccessToken: !!data.session?.access_token,
      hasRefreshToken: !!data.session?.refresh_token
    })
    
    // Verify session was saved
    setTimeout(() => {
      const allKeys = Object.keys(localStorage)
      const authKeys = allKeys.filter(k => k.includes('supabase') || k.includes('sb-'))
      console.log("🔍 localStorage keys after login:", authKeys)
      
      if (authKeys.length > 0) {
        console.log("✅✅✅ SESSION SAVED TO LOCALSTORAGE!")
        authKeys.forEach(key => {
          const val = localStorage.getItem(key)
          if (val) console.log(`   ${key}: ${val.substring(0, 50)}...`)
        })
      } else {
        console.error("❌❌❌ NO SESSION IN LOCALSTORAGE!")
      }
    }, 500)
    
    return { error: null }
  }

  const signUp = async (email: string, password: string, options?: { full_name?: string }) => {
    const client = getSupabase()
    if (!client) return { error: "Auth not configured" }

    const { error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: options?.full_name || "" },
      },
    })
    
    if (error) {
      return { error: error.message }
    }
    
    return { error: null }
  }

  const signOut = async () => {
    const client = getSupabase()
    if (!client) return
    
    console.log("🚪 Signing out...")
    await client.auth.signOut()
    localStorage.clear() // Clear all localStorage
    window.location.href = "/auth/login"
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}

// Export supabase with non-null assertion for TypeScript
export { supabase }
export const sb = supabase!

