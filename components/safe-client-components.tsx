"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { MobileNavSimple as MobileNav } from "@/components/mobile-nav-simple"
import { BackToTop } from "@/components/back-to-top"

export function SafeClientComponents() {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render on auth pages (login, signup, etc.)
  const isAuthPage = pathname === '/login' || 
                     pathname === '/signup' || 
                     pathname === '/auth' ||
                     pathname === '/reset-password' ||
                     pathname === '/verify-email' ||
                     pathname?.startsWith('/auth/')

  if (!mounted || isAuthPage) return null

  try {
    return (
      <>
        <MobileNav />
        <BackToTop />
      </>
    )
  } catch (error) {
    console.error('SafeClientComponents error:', error)
    return null
  }
}