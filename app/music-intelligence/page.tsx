"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Music, Search, BarChart3, Users } from "lucide-react"

export default function CombinedMusicPage() {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-3 sm:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 sm:mb-8">
                                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-montserrat">
                    Music Intelligence
                </h1>
                <p className="text-gray-400">
                  Comprehensive music data combining Spotify and SpotonTrack APIs
                </p>
              </div>

              {/* Feature Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <Card className="bg-gray-800/90 border-gray-700 border-blue-500/20">
                  <CardContent className="p-4 text-center">
                    <Search className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                    <h3 className="text-white font-medium mb-1 text-sm font-montserrat">Universal Search</h3>
                    <p className="text-gray-400 text-xs">
                      Search across multiple databases
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/90 border-gray-700 border-green-500/20">
                  <CardContent className="p-4 text-center">
                    <Music className="w-5 h-5 text-green-400 mx-auto mb-2" />
                    <h3 className="text-white font-medium mb-1 text-sm font-montserrat">Rich Metadata</h3>
                    <p className="text-gray-400 text-xs">
                      Credits & collaboration data
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/90 border-gray-700 border-purple-500/20">
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                    <h3 className="text-white font-medium mb-1 text-sm font-montserrat">Streaming Analytics</h3>
                    <p className="text-gray-400 text-xs">
                      Charts & performance metrics
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/90 border-gray-700 border-orange-500/20">
                  <CardContent className="p-4 text-center">
                    <Users className="w-5 h-5 text-orange-400 mx-auto mb-2" />
                    <h3 className="text-white font-medium mb-1 text-sm font-montserrat">Collaboration Network</h3>
                    <p className="text-gray-400 text-xs">
                      Artist connections
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Music Intelligence Placeholder */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Music Intelligence</h3>
                    <p className="text-gray-400">
                      Music intelligence features are currently being updated. Please check back soon.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
  )
}
