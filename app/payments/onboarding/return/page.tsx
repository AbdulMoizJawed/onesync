"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import CustomLoader from "@/components/ui/custom-loader"

export default function OnboardingReturnPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkOnboardingStatus = useCallback(async () => {
    if (!user || !supabase) return

    try {
      const { data, error } = await supabase
        .from("stripe_accounts")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (error) {
        console.error("Error checking onboarding status:", error)
        setError("Failed to check onboarding status")
        return
      }

      if (!data) {
        // No Stripe account found, redirect to onboarding
        router.push("/payments/onboarding")
        return
      }

      // Check if account is fully onboarded
      if (!data.details_submitted || !data.charges_enabled) {
        router.push("/payments/onboarding")
        return
      }

      // Successful onboarding
      router.push("/dashboard")
    } catch (error) {
      console.error("Error checking onboarding status:", error)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }, [user, router])

  useEffect(() => {
    if (user) {
      checkOnboardingStatus()
    }
  }, [user, checkOnboardingStatus])

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen bg-gray-950">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-center min-h-[400px]">
                  <CustomLoader size="lg" showText text="Checking onboarding status..." />
                </div>
              </div>
            </main>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen bg-gray-950">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-white mb-4">Onboarding Error</h2>
                  <p className="text-gray-400 mb-6">{error}</p>
                  <button 
                    onClick={() => router.push("/payments/onboarding")} 
                    className="button-primary"
                  >
                    Retry Onboarding
                  </button>
                </div>
              </div>
            </main>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return null
}
