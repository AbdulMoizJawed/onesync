"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase, hasValidSupabaseConfig } from "./supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, options?: { full_name?: string }) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export { supabase }

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if Supabase is configured
    if (!hasValidSupabaseConfig() || !supabase) {
      console.error('❌ Supabase not configured')
      setLoading(false)
      return
    }

    console.log('🔧 Auth: Initializing...')
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('⏰ Auth timeout - forcing loading to false')
      setLoading(false)
    }, 3000) // 3 second timeout

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        clearTimeout(timeout)
        
        if (error) {
          console.error('❌ Auth: Error getting session:', error)
          setUser(null)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          console.log('✅ Auth: Session found:', session.user.email)
          setUser(session.user)
        } else {
          console.log('⚠️ Auth: No session found')
          setUser(null)
        }
        setLoading(false)
      })
      .catch((error) => {
        clearTimeout(timeout)
        console.error('❌ Auth: Exception getting session:', error)
        setUser(null)
        setLoading(false)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔔 Auth: State changed:', _event, session?.user?.email || 'no user')
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, options?: { full_name?: string }) => {
    if (!supabase) {
      return { error: "Authentication service is not available." }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: options?.full_name || "" },
          emailRedirectTo: "https://app.onesync.music/auth/callback",
        },
      })

      if (error) {
        console.error("❌ Signup error:", error)
        return { error: error.message }
      }

      console.log("✅ Signup successful:", data.user?.email)
      return { error: null }
    } catch (error) {
      console.error("❌ Unexpected signup error:", error)
      return { error: "An unexpected error occurred. Please try again." }
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: "Authentication service is not available." }
    }

    try {
      console.log('🔐 Auth: Signing in:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("❌ SignIn error:", error)
        
        if (error.message.includes("Invalid login credentials")) {
          return { error: "Invalid email or password." }
        }
        if (error.message.includes("Email not confirmed")) {
          return { error: "Please confirm your email before signing in." }
        }
        
        return { error: error.message }
      }

      console.log("✅ SignIn successful:", data.user?.email)
      
      // Verify session is saved
      setTimeout(() => {
        const keys = Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('sb-'))
        if (keys.length > 0) {
          console.log("✅ Session saved to localStorage:", keys)
        } else {
          console.error("❌ CRITICAL: No session in localStorage!")
        }
      }, 200)

      return { error: null }
    } catch (error) {
      console.error("❌ Unexpected signin error:", error)
      return { error: "An unexpected error occurred. Please try again." }
    }
  }

  const signOut = async () => {
    if (!supabase) return

    try {
      await supabase.auth.signOut()
      setUser(null)
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    } catch (error) {
      console.error("❌ Sign out error:", error)
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

