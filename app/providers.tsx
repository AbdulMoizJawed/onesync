'use client'

import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth"
import { SafeClientComponents } from "@/components/safe-client-components"
import React from "react"
import { PresenceProvider } from "@/components/presence-provider"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Elements stripe={stripePromise}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
           <PresenceProvider>
          {children}
          </PresenceProvider>
          <SafeClientComponents />
        </AuthProvider>
      </ThemeProvider>
    </Elements>
  )
}