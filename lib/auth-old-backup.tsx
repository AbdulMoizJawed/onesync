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


export { supabase };

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Always use real Supabase authentication
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔧 AuthProvider initializing...')

    // If Supabase is not configured, set loading to false and return
    if (!hasValidSupabaseConfig() || !supabase) {
      console.log('❌ Supabase not configured')
      setLoading(false)
      return
    }

    // Get initial session
    const initializeAuth = async () => {
      try {
        if (!supabase) {
          console.error("❌ NO SUPABASE CLIENT!")
          setUser(null)
          setLoading(false)
          return
        }
        
        console.log("📡 Getting session from localStorage...")
        // Get existing session from localStorage (don't force refresh on every load)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log("📡 getSession result:", {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          error: error?.message
        })
        
        if (error) {
          console.error("❌ Session error:", error)
          setUser(null)
        } else if (session?.user) {
          console.log("✅ Session found! User:", session.user.email)
          setUser(session.user)
        } else {
          console.log("⚠️ No session found in localStorage")
          setUser(null)
        }
      } catch (error) {
        console.error("❌ Auth initialization error:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes with more robust handling
    if (!supabase) {
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 Auth state changed:", event, session?.user?.email || 'no-user')
      
      // Don't reset user on initial subscriber setup
      if (event === 'INITIAL_SESSION') {
        console.log("📋 Initial session loaded")
        setUser(session?.user ?? null)
        setLoading(false)
        return
      }

      // Handle auth events
      if (event === 'SIGNED_IN') {
        console.log("✅ User signed in:", session?.user?.email)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Log user activity when they sign in
        if (session?.user && supabase) {
          try {
            await supabase.from("activity_log").insert({
              user_id: session.user.id,
              action: "sign_in",
              description: "User signed in to the platform",
            })
          } catch (error) {
            console.error("Failed to log sign in activity:", error)
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log("🚪 User signed out")
        setUser(null)
        setLoading(false)
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("🔄 Token refreshed:", session?.user?.email)
        setUser(session?.user ?? null)
      } else if (event === 'USER_UPDATED') {
        console.log("👤 User updated:", session?.user?.email)
        setUser(session?.user ?? null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, options?: { full_name?: string }) => {
    if (!supabase) {
      return { error: "Authentication service is not available. Please check your configuration." }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: options?.full_name || "",
          },
          emailRedirectTo: "https://app.onesync.music/auth/callback",
        },
      })

      if (error) {
        console.error("Supabase signup error:", error)

        // Handle specific error types with user-friendly messages
        if (error.message.includes("rate limit")) {
          return { error: "Too many signup attempts. Please wait a few minutes before trying again." }
        }

        if (error.message.includes("already registered")) {
          return { error: "An account with this email already exists. Please try signing in instead." }
        }

        if (error.message.includes("invalid email") || error.message.includes("Email address")) {
          return { error: "Please enter a valid email address." }
        }

        if (error.message.includes("password")) {
          return { error: "Password must be at least 6 characters long." }
        }

        return { error: error.message }
      }

      console.log("Signup successful:", data.user?.email)
      return { error: null }
    } catch (error) {
      console.error("Unexpected signup error:", error)
      return { error: "An unexpected error occurred. Please try again." }
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log("🔐 Auth provider signIn called for:", email)
    
    if (!supabase) {
      console.error("❌ Supabase client not available")
      return { error: "Authentication service is not available. Please check your configuration." }
    }

    try {
      console.log("📡 Attempting Supabase signInWithPassword...")
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("❌ Supabase signin error:", error)

        if (error.message.includes("Invalid login credentials")) {
          return { error: "Invalid email or password. Please check your credentials and try again." }
        }

        if (error.message.includes("Email not confirmed")) {
          return { error: "Please check your email and click the confirmation link before signing in." }
        }

        return { error: error.message }
      }

      // Log session details
      console.log("✅ Login successful! Session details:", {
        hasSession: !!data.session,
        hasUser: !!data.user,
        email: data.user?.email,
        hasAccessToken: !!data.session?.access_token,
        hasRefreshToken: !!data.session?.refresh_token
      })

      // Explicitly set the user after successful login to avoid race conditions
      if (data.user) {
        console.log("✅ Setting user state directly after successful login:", data.user.email)
        setUser(data.user)
        setLoading(false)
        
        // VERIFY session is in localStorage
        setTimeout(() => {
          const storedSession = localStorage.getItem('sb-auth-token')
          if (storedSession) {
            console.log("✅✅✅ VERIFIED: Session IS in localStorage!")
          } else {
            console.error("❌❌❌ CRITICAL: Session NOT in localStorage after login!")
          }
        }, 100)
      }

      return { error: null }
    } catch (error) {
      console.error("❌ Unexpected signin error:", error)
      return { error: "An unexpected error occurred. Please try again." }
    }
  }

  const signOut = async () => {
    if (!supabase) return

    try {
      // Log sign out activity before signing out
      if (user) {
        await supabase.from("activity_log").insert({
          user_id: user.id,
          action: "sign_out",
          description: "User signed out of the platform",
        })
      }

      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
      } else {
        // Clear user state immediately
        setUser(null)
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
      }
    } catch (error) {
      console.error("Unexpected sign out error:", error)
      // Still redirect even if there's an error
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  // Always use real Supabase authentication
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
