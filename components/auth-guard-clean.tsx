"use client"

import type React from "react"
import { useEffect, useState } from "react"
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
  const [mounted, setMounted] = useState(false)

  // Wait for component to mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle redirects ONLY when auth is done loading
  useEffect(() => {
    if (!mounted || loading) return

    // On auth pages
    if (pathname?.startsWith('/auth')) {
      if (user) {
        console.log("✅ User on auth page, redirecting to dashboard")
        router.replace("/")
      }
      return
    }

    // On protected pages
    if (requireAuth && !user) {
      console.log("❌ No user on protected page, redirecting to login")
      router.replace("/auth/login")
      return
    }

    if (user) {
      console.log("✅ User authenticated:", user.email)
    }
  }, [user, loading, mounted, requireAuth, router, pathname])

  // Show loading while initializing
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <CustomLoader size="lg" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading while redirecting
  if (requireAuth && !user) {
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

