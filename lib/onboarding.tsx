"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

// This hook manages the onboarding flow for new users
export function useOnboarding() {
  const { user } = useAuth()
  const router = useRouter()
  const [isNewUser, setIsNewUser] = useState<boolean | null>(() => {
    // Check localStorage immediately for client-side rendering
    if (typeof window !== 'undefined') {
      return localStorage.getItem("isNewUser") === "true"
    }
    return null
  })
  const [needsProfileSetup, setNeedsProfileSetup] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if this is a new user that needs onboarding
  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    const checkUserStatus = async () => {
      try {
        setIsLoading(true)
        
        // Check if onboarding was already completed
        const onboardingCompleted = localStorage.getItem("onboardingCompleted") === "true"
        
        // Check when the user was created
        const userCreatedAt = user.created_at ? new Date(user.created_at) : null
        const isRecentlyCreated = userCreatedAt && 
          (Date.now() - userCreatedAt.getTime() < 1000 * 60 * 60 * 24) // Within 24 hours
        
        // Check if they have a complete profile
        let hasCompleteProfile = false
        if (supabase) {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("full_name, username")
            .eq("id", user.id)
            .single()
          
          if (!error && profile) {
            hasCompleteProfile = !!(profile.full_name && profile.username)
          }
        }
        
        // User needs onboarding if:
        // 1. They haven't completed onboarding AND
        // 2. They don't have a complete profile AND 
        // 3. They were created recently
        const needsOnboarding = !onboardingCompleted && !hasCompleteProfile && isRecentlyCreated
        
        setIsNewUser(needsOnboarding)
        setNeedsProfileSetup(!hasCompleteProfile)
        
        if (needsOnboarding) {
          localStorage.setItem("isNewUser", "true")
        }
        
      } catch (error) {
        console.error("Error checking user status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserStatus()
  }, [user])

  // Start the onboarding process for a new user
  const startOnboarding = () => {
    if (!user) return
    
    // Set the onboarding flag in localStorage
    localStorage.setItem("isOnboarding", "true")
    localStorage.removeItem("onboardingCompleted")
    
    // Clear the new user flag
    localStorage.removeItem("isNewUser")
  }
  
  // Skip the onboarding process
  const skipOnboarding = () => {
    localStorage.removeItem("isNewUser")
    localStorage.setItem("onboardingCompleted", "true")
    router.push("/")
  }

  // Complete the onboarding process
  const completeOnboarding = () => {
    localStorage.setItem("onboardingCompleted", "true")
    localStorage.removeItem("isNewUser")
    setIsNewUser(false)
    setNeedsProfileSetup(false)
  }

  return { 
    isNewUser, 
    needsProfileSetup,
    isLoading, 
    startOnboarding,
    skipOnboarding,
    completeOnboarding
  }
}
