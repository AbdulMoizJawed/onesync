"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import CustomLoader from "@/components/ui/custom-loader"

interface SpotifyDataModalProps {
  trackId: string
  trackName: string
  artistName: string
  children?: React.ReactNode
  trigger?: React.ReactNode
}

export function SpotifyDataModal({
  trackId,
  trackName,
  artistName,
  children,
  trigger
}: SpotifyDataModalProps) {
  const [loading, setLoading] = useState(false)
  const [spotifyData, setSpotifyData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchSpotifyData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch Spotify data
      const response = await fetch(`/api/spotify/track/${trackId}`)
      if (!response.ok) throw new Error('Failed to fetch Spotify data')
      
      const data = await response.json()
      setSpotifyData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild onClick={fetchSpotifyData}>
        {trigger || children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <span className="text-green-500">🎵</span>
            Spotify Data for "{trackName}"
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            by {artistName}
          </DialogDescription>
        </DialogHeader>
        
        {loading && (
          <div className="flex justify-center py-8">
            <CustomLoader />
          </div>
        )}

        {error && (
          <div className="text-red-400 text-center py-4">
            Error: {error}
          </div>
        )}

        {spotifyData && (
          <div className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Track ID:</span>
                    <span className="text-white font-mono text-sm">{spotifyData.id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Popularity:</span>
                    <Badge variant="secondary">{spotifyData.popularity || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white">{spotifyData.duration_ms ? `${Math.round(spotifyData.duration_ms / 1000)}s` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Explicit:</span>
                    <Badge variant={spotifyData.explicit ? "destructive" : "default"}>
                      {spotifyData.explicit ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <h4 className="text-white font-semibold mb-2">Raw Data</h4>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(spotifyData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
