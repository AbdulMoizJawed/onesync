"use client"

import { useAuth } from "@/lib/auth"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import SpotOnTrackVerifier from "@/components/spotontrack-verifier"

export default function SpotOnTrackVerifyPage() {
  const { user } = useAuth()

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">SpotOnTrack API Verification</h1>
                <p className="text-gray-400 text-sm sm:text-base">Check if the SpotOnTrack API is properly configured and working</p>
              </div>

              <SpotOnTrackVerifier />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
