"use client"

import { useEffect } from "react"
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

  useEffect(() => {
    console.log("🛡️ AuthGuard:", { user: user?.email || 'NO USER', loading, requireAuth, pathname })
    
    if (loading) {
      console.log("⏳ Still loading, waiting...")
      return
    }

    const isAuthPage = pathname?.startsWith("/auth")

    if (requireAuth && !user && !isAuthPage) {
      console.log("🚨 PROTECTED PAGE, NO USER -> REDIRECTING TO LOGIN")
      router.push("/auth/login")
    } else if (!requireAuth && user && isAuthPage) {
      console.log("✅ User on auth page -> redirect to dashboard")
      router.push("/")
    } else if (user) {
      console.log("✅ User authenticated:", user.email)
    } else {
      console.log("⚠️ No user, but on auth page or not requiring auth")
    }
  }, [user, loading, requireAuth, router, pathname])

  // Show loading while checking auth
  if (loading) {
    console.log("⏳ Showing loading spinner (auth loading)")
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <CustomLoader size="lg" />
      </div>
    )
  }

  // Protected page but no user - show loading while redirecting
  if (requireAuth && !user) {
    console.log("🔒 NO USER on protected page - showing loading (redirecting...)")
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <CustomLoader size="lg" />
      </div>
    )
  }

  // Auth page but has user - show loading while redirecting
  if (!requireAuth && user) {
    console.log("↩️ User on auth page - showing loading (redirecting...)")
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <CustomLoader size="lg" />
      </div>
    )
  }

  console.log("✅ Rendering children")
  return <>{children}</>
}

