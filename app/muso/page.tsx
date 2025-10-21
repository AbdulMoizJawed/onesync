"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { MusoArtistSearch } from "@/components/muso-artist-search"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Music } from "lucide-react"

export default function MusoPage() {
  return (
    <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-3 sm:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Muso.AI Integration
                </h1>
                <p className="text-gray-400">
                  Explore music industry data, artist credits, and collaboration networks
                </p>
              </div>

              {/* Rate Limit Notice */}
              <Card className="card-dark border-orange-500/50 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-orange-400" />
                    <h3 className="text-lg font-semibold text-white">API Status Notice</h3>
                  </div>
                  <div className="text-gray-300 space-y-2">
                    <p>The MUSO.AI API has very strict rate limits and may show rate limiting errors.</p>
                    <p className="text-sm text-gray-400">
                      This is normal behavior for their API. If you see errors, please wait 5-10 minutes before trying again.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <MusoArtistSearch />
            </div>
          </main>
        </div>
      </div>
  )
}
