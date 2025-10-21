"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth"
import CustomLoader from "@/components/ui/custom-loader"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const redirectGuard = useRef(false)
  const [isReady, setIsReady] = useState(false)

  // Set ready state after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isReady) return
    
    console.log("🛡️ AuthGuard check - user:", user?.email || 'null', "loading:", loading, "path:", pathname)
    
    if (loading) {
      console.log("⏳ Auth still loading, waiting...")
      return
    }

    // Avoid redirecting if we're already on an auth route to prevent loops
    if (pathname && pathname.startsWith('/auth')) {
      console.log("🔓 Already on auth route, skipping redirect")
      return
    }

    // Give session restoration MORE time before redirecting (increased from 200ms to 1000ms)
    if (requireAuth && !user && !redirectGuard.current) {
      console.log("⏰ No user found, waiting 1000ms before redirect...")
      const timeoutId = setTimeout(() => {
        // Double-check user is still null after brief delay
        if (!user && !redirectGuard.current) {
          redirectGuard.current = true
          console.log("🚨 No user after 1000ms delay, redirecting to login...")
          router.replace("/auth/login")
        } else {
          console.log("✅ User loaded during delay period, NOT redirecting")
        }
      }, 1000)
      
      return () => clearTimeout(timeoutId)
    } else if (!requireAuth && user) {
      console.log("↩️ User on auth page, redirecting to dashboard...")
      router.replace("/")
    }
    
    // Reset guard if user is found
    if (user) {
      console.log("✅ User found in AuthGuard:", user.email)
      redirectGuard.current = false
    }
  }, [user, loading, requireAuth, router, pathname, isReady])

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <CustomLoader size="lg" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading state while redirecting to prevent flash of content
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <CustomLoader size="lg" />
          <p className="text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Show loading state while redirecting authenticated users away from auth pages
  if (!requireAuth && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <CustomLoader size="lg" />
          <p className="text-gray-400">Redirecting...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
