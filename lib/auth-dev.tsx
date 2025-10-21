"use client"

import type React from "react"
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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Development mode mock user
const createMockUser = (email: string): User => ({
  id: `dev-user-${Date.now()}`,
  email,
  user_metadata: { full_name: "Development User" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  phone_confirmed_at: undefined,
  confirmation_sent_at: undefined,
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  role: "authenticated",
  phone: undefined,
  recovery_sent_at: undefined,
  email_change_sent_at: undefined,
  new_email: undefined,
  invited_at: undefined,
  action_link: undefined,
  is_anonymous: false,
  identities: []
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If Supabase is not configured, use development mode
    if (!hasValidSupabaseConfig() || !supabase) {
      console.log("🚀 Running in DEVELOPMENT MODE - Supabase not configured")
      
      // Check for existing dev session
      const devUser = localStorage.getItem('dev-auth-user')
      if (devUser) {
        try {
          setUser(JSON.parse(devUser))
        } catch (e) {
          localStorage.removeItem('dev-auth-user')
        }
      }
      
      setLoading(false)
      return
    }

    // Get initial session with error handling
    const initializeAuth = async () => {
      try {
        if (!supabase) {
          setLoading(false)
          return
        }
        
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting initial session:", error)
        } else {
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)
      setUser(session?.user ?? null)
      setLoading(false)

      // Log user activity when they sign in
      if (event === "SIGNED_IN" && session?.user && supabase) {
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
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, options?: { full_name?: string }) => {
    // Development mode
    if (!hasValidSupabaseConfig() || !supabase) {
      console.log("🚀 DEV MODE: Mock signup for", email)
      
      // Simple validation
      if (!email || !password) {
        return { error: "Email and password are required" }
      }
      
      if (password.length < 6) {
        return { error: "Password must be at least 6 characters long" }
      }
      
      // Create mock user
      const mockUser = createMockUser(email)
      setUser(mockUser)
      localStorage.setItem('dev-auth-user', JSON.stringify(mockUser))
      
      return { error: null }
    }

    // Production Supabase mode
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: options?.full_name || "",
          },
          emailRedirectTo: "https://app.onesync.music/auth/confirm",
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
    // Development mode
    if (!hasValidSupabaseConfig() || !supabase) {
      console.log("🚀 DEV MODE: Mock signin for", email)
      
      // Simple validation
      if (!email || !password) {
        return { error: "Email and password are required" }
      }
      
      // Create mock user and sign them in
      const mockUser = createMockUser(email)
      setUser(mockUser)
      localStorage.setItem('dev-auth-user', JSON.stringify(mockUser))
      
      return { error: null }
    }

    // Production Supabase mode
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Supabase signin error:", error)

        if (error.message.includes("Invalid login credentials")) {
          return { error: "Invalid email or password. Please check your credentials and try again." }
        }

        if (error.message.includes("Email not confirmed")) {
          return { error: "Please check your email and click the confirmation link before signing in." }
        }

        return { error: error.message }
      }

      console.log("Signin successful:", data.user?.email)
      return { error: null }
    } catch (error) {
      console.error("Unexpected signin error:", error)
      return { error: "An unexpected error occurred. Please try again." }
    }
  }

  const signOut = async () => {
    // Development mode
    if (!hasValidSupabaseConfig() || !supabase) {
      console.log("🚀 DEV MODE: Mock signout")
      setUser(null)
      localStorage.removeItem('dev-auth-user')
      return
    }

    // Production Supabase mode
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
      }
    } catch (error) {
      console.error("Unexpected sign out error:", error)
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
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
