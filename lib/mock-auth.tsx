"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

interface MockUser {
  id: string
  email: string
  full_name?: string
}

interface MockAuthContextType {
  user: MockUser | null
  loading: boolean
  signUp: (email: string, password: string, options?: { full_name?: string }) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined)

// Mock users for development
const MOCK_USERS = [
  { id: "1", email: "demo@example.com", password: "password", full_name: "Demo User" },
  { id: "2", email: "test@example.com", password: "test123", full_name: "Test User" },
  { id: "3", email: "admin@example.com", password: "admin", full_name: "Admin User" },
]

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null)
  const [loading, setLoading] = useState(false)

  const signUp = async (email: string, password: string, options?: { full_name?: string }) => {
    setLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Check if user already exists
    const existingUser = MOCK_USERS.find(u => u.email === email)
    if (existingUser) {
      setLoading(false)
      return { error: "An account with this email already exists. Please try signing in instead." }
    }

    // Create new mock user
    const newUser = {
      id: Date.now().toString(),
      email,
      full_name: options?.full_name || ""
    }

    MOCK_USERS.push({ ...newUser, password })
    setUser(newUser)
    setLoading(false)
    
    console.log("Mock signup successful:", email)
    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const mockUser = MOCK_USERS.find(u => u.email === email && u.password === password)
    
    if (!mockUser) {
      setLoading(false)
      return { error: "Invalid email or password. Try demo@example.com / password" }
    }

    setUser({
      id: mockUser.id,
      email: mockUser.email,
      full_name: mockUser.full_name
    })
    
    setLoading(false)
    console.log("Mock signin successful:", email)
    return { error: null }
  }

  const signOut = async () => {
    setUser(null)
    console.log("Mock signout successful")
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>
}

export function useMockAuth() {
  const context = useContext(MockAuthContext)
  if (context === undefined) {
    throw new Error("useMockAuth must be used within a MockAuthProvider")
  }
  return context
}
