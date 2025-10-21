import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Profile = {
  id: string
  email: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false
  
  // Check if username exists and is not a temporary username
  const hasRealUsername = profile.username && !profile.username.startsWith("user_")
  
  // Avatar is optional - just need a real username
  return Boolean(hasRealUsername)
}

export function generateTempUsername(userId: string): string {
  const shortId = userId.substring(0, 8)
  return `user_${shortId}`
}

export function getDisplayName(profile: Profile | null): string {
  if (!profile) return "Anonymous"
  
  // Use real username if available
  if (profile.username && !profile.username.startsWith("user_")) {
    return profile.username
  }
  
  // Fall back to full name
  return profile.full_name || "Anonymous"
}

// Consolidated profile creation and management functions
export async function createUserProfile(user: User, additionalData?: {
  full_name?: string
  username?: string
  bio?: string
}) {
  if (!supabase) {
    throw new Error("Supabase client not initialized")
  }

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single()

  if (existingProfile) {
    return existingProfile
  }

  // Generate username if not provided
  const username = additionalData?.username || generateTempUsername(user.id)

  const profileData = {
    id: user.id,
    email: user.email!,
    full_name: additionalData?.full_name || user.user_metadata?.full_name || null,
    username,
    bio: additionalData?.bio || null,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert([profileData])
    .select()
    .single()

  if (error) {
    // If duplicate key error, try to fetch existing profile
    if (error.code === "23505" || error.message?.includes("duplicate key")) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      
      if (existing) {
        return existing
      }
    }
    throw error
  }

  return data
}

export async function ensureUserProfile(user: User) {
  if (!supabase) {
    throw new Error("Supabase client not initialized")
  }

  try {
    // Try to fetch existing profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error && error.code === "PGRST116") {
      // Profile doesn't exist, create it
      return await createUserProfile(user)
    } else if (error) {
      throw error
    }

    return profile
  } catch (err) {
    console.error("Error ensuring user profile:", err)
    throw err
  }
}

export async function updateUserProfile(userId: string, updates: {
  full_name?: string
  username?: string
  bio?: string
  avatar_url?: string
}) {
  if (!supabase) {
    throw new Error("Supabase client not initialized")
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

// API Error handling utilities
export class APIError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export function createErrorResponse(
  error: unknown,
  defaultMessage: string = 'Internal server error',
  defaultStatus: number = 500
) {
  console.error('API Error:', error)
  
  if (error instanceof APIError) {
    return NextResponse.json(
      { 
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      },
      { status: error.status }
    )
  }
  
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized', timestamp: new Date().toISOString() },
        { status: 401 }
      )
    }
    
    if (error.message.includes('404') || error.message.includes('Not found')) {
      return NextResponse.json(
        { error: 'Resource not found', timestamp: new Date().toISOString() },
        { status: 404 }
      )
    }
    
    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      return NextResponse.json(
        { error: 'Request timeout', timestamp: new Date().toISOString() },
        { status: 504 }
      )
    }
    
    return NextResponse.json(
      { 
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: defaultStatus }
    )
  }
  
  return NextResponse.json(
    { 
      error: defaultMessage,
      timestamp: new Date().toISOString()
    },
    { status: defaultStatus }
  )
}

export function validateRequiredFields(data: Record<string, any>, fields: string[]): string[] {
  const missing: string[] = []
  
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field)
    }
  }
  
  return missing
}

// Currency formatting utility
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Date formatting utility
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

// Relative time formatting utility
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return months === 1 ? '1 month ago' : `${months} months ago`
  } else {
    const years = Math.floor(diffDays / 365)
    return years === 1 ? '1 year ago' : `${years} years ago`
  }
}
