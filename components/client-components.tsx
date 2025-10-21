"use client"

import { useEffect, useState } from "react"

export function ClientComponents() {
  const [isMounted, setIsMounted] = useState(false)
  const [MobileNav, setMobileNav] = useState<any>(null)
  const [BackToTop, setBackToTop] = useState<any>(null)

  // Prevent hydration mismatch by only rendering on client
  useEffect(() => {
    const loadComponents = async () => {
      try {
        // Dynamic import on client side only
        const [mobileNavModule, backToTopModule] = await Promise.all([
          import("@/components/mobile-nav"),
          import("@/components/back-to-top")
        ])
        
        setMobileNav(() => mobileNavModule.MobileNav)
        setBackToTop(() => backToTopModule.BackToTop)
        setIsMounted(true)
      } catch (error) {
        console.error("Failed to load client components:", error)
        setIsMounted(true) // Still set mounted to avoid infinite loading
      }
    }

    loadComponents()
  }, [])

  // Don't render anything during SSR or before components are loaded
  if (!isMounted || !MobileNav || !BackToTop) {
    return null
  }

  return (
    <>
      <MobileNav />
      <BackToTop />
    </>
  )
}