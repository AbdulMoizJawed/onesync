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

interface SpotonTrackDataModalProps {
  trackId?: string
  trackName: string
  artistName: string
  children?: React.ReactNode
  trigger?: React.ReactNode
}

export function SpotonTrackDataModal({
  trackId,
  trackName,
  artistName,
  children,
  trigger
}: SpotonTrackDataModalProps) {
  const [loading, setLoading] = useState(false)
  const [spotontrackData, setSpotontrackData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchSpotonTrackData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Search for track using SpotonTrack API
      const response = await fetch(`/api/spotontrack-search?query=${encodeURIComponent(`${trackName} ${artistName}`)}`)
      if (!response.ok) throw new Error('Failed to fetch SpotonTrack data')
      
      const data = await response.json()
      setSpotontrackData(data.results?.[0] || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild onClick={fetchSpotonTrackData}>
        {trigger || children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <span className="text-blue-500">📈</span>
            SpotonTrack Data for "{trackName}"
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

        {spotontrackData && (
          <div className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">ISRC:</span>
                    <span className="text-white font-mono text-sm">{spotontrackData.isrc || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white">{spotontrackData.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Release Date:</span>
                    <span className="text-white">{spotontrackData.release_date || 'N/A'}</span>
                  </div>
                  {spotontrackData.artists && spotontrackData.artists.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Artists:</span>
                      <div className="flex flex-wrap gap-1">
                        {spotontrackData.artists.map((artist: any, index: number) => (
                          <Badge key={index} variant="secondary">
                            {artist.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <h4 className="text-white font-semibold mb-2">Raw Data</h4>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(spotontrackData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}

        {!spotontrackData && !loading && !error && (
          <div className="text-gray-400 text-center py-4">
            No data found for this track
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
