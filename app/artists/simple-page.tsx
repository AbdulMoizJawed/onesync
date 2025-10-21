"use client"

import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import ArtistProfileComponent from "@/components/artist-profile"

export default function ArtistsPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-3 sm:p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">Artist Management</h1>
                  <p className="text-gray-400">Manage your artist profile and collaborations</p>
                </div>
              </div>

              {/* Artist Profile */}
              <div className="space-y-6">
                <ArtistProfileComponent />
                
                {/* Placeholder for future features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card-dark p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Collaborations</h3>
                    <p className="text-gray-400">Collaboration management coming soon...</p>
                  </div>
                  <div className="card-dark p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Team</h3>
                    <p className="text-gray-400">Team management coming soon...</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
