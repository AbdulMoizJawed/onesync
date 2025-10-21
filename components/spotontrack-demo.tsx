"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Music, PlayCircle, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import Image from 'next/image'

interface EnhancedTrack {
  id: string
  name: string
  artists: Array<{ name: string }>
  album: {
    name: string
    images: Array<{ url: string }>
  }
  duration_ms: number
  popularity: number
  preview_url?: string
  external_urls: { spotify: string }
  spotontrack_data?: {
    streams: {
      total: number
      daily: number
      weekly: number
      monthly: number
    }
    playlists: {
      total: number
      additions_last_week: number
    }
    charts: any
    marketData: {
      popularity: number
      virality_score: number
      commercial_appeal: number
    }
  }
  enhanced: boolean
}

interface TrackSearchResponse {
  success: boolean
  data: EnhancedTrack[]
  artist_data?: any
  source: string
  meta: {
    spotify_tracks_count: number
    spotontrack_artist_data: boolean
    enhanced_tracks_count: number
  }
}

export default function SpotOnTrackDemo() {
  const [artistName, setArtistName] = useState("")
  const [source, setSource] = useState("combined")
  const [tracks, setTracks] = useState<EnhancedTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [meta, setMeta] = useState<any>(null)

  const searchTracks = async () => {
    if (!artistName.trim()) {
      toast.error("Please enter an artist name")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/artist/tracks?name=${encodeURIComponent(artistName)}&source=${source}`)
      const data: TrackSearchResponse = await response.json()

      if (data.success) {
        setTracks(data.data)
        setMeta(data.meta)
        toast.success(`Found ${data.data.length} tracks from ${data.source}`)
      } else {
        toast.error("Failed to fetch tracks")
      }
    } catch (error) {
      console.error("Error fetching tracks:", error)
      toast.error("Error fetching tracks")
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <Card className="card-dark">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Music className="w-5 h-5" />
            SpotOnTrack Integration Demo
          </CardTitle>
          <p className="text-gray-400">
            Search for artist tracks with enhanced data from SpotOnTrack API
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label className="text-white text-sm">Artist Name</Label>
              <Input
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="Enter artist name"
                className="input-dark"
                onKeyPress={(e) => e.key === 'Enter' && searchTracks()}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white text-sm">Data Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="input-dark">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-gray-800">
                  <SelectItem value="combined" className="text-gray-200">
                    <span className="hidden sm:inline">Combined (Spotify + SpotOnTrack)</span>
                    <span className="sm:hidden">Combined</span>
                  </SelectItem>
                  <SelectItem value="spotify" className="text-gray-200">
                    Spotify Only
                  </SelectItem>
                  <SelectItem value="spotontrack" className="text-gray-200">
                    <span className="hidden sm:inline">SpotOnTrack Only</span>
                    <span className="sm:hidden">SpotOnTrack</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <Button
                onClick={searchTracks}
                disabled={loading}
                className="w-full button-primary"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Tracks
                  </>
                )}
              </Button>
            </div>
          </div>

          {meta && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs sm:text-sm text-gray-400">Spotify Tracks</div>
                <div className="text-lg sm:text-xl font-bold text-white">{meta.spotify_tracks_count}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs sm:text-sm text-gray-400">Enhanced Tracks</div>
                <div className="text-lg sm:text-xl font-bold text-green-400">{meta.enhanced_tracks_count}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs sm:text-sm text-gray-400">Artist Data</div>
                <div className="text-lg sm:text-xl font-bold text-blue-400">
                  {meta.spotontrack_artist_data ? 'Yes' : 'No'}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs sm:text-sm text-gray-400">Source</div>
                <div className="text-sm sm:text-lg font-bold text-purple-400 capitalize">{source}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {tracks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">Track Results</h3>
          <div className="grid gap-4">
            {tracks.map((track) => (
              <Card key={track.id} className="card-dark">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {track.album.images[0] && (
                      <Image
                        src={track.album.images[0].url}
                        alt={track.album.name}
                        width={64}
                        height={64}
                        unoptimized
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-white text-sm sm:text-base truncate">{track.name}</h4>
                          <p className="text-xs sm:text-sm text-gray-400 truncate">
                            {track.artists.map(a => a.name).join(', ')} • {track.album.name}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                            <span>{formatDuration(track.duration_ms)}</span>
                            <span>Popularity: {track.popularity}/100</span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {track.enhanced && (
                            <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">
                              Enhanced
                            </Badge>
                          )}
                          {track.preview_url && (
                            <Button size="sm" variant="ghost" className="text-blue-400 h-8 w-8 p-0">
                              <PlayCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {track.spotontrack_data && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-4 p-3 bg-gray-800/50 rounded-lg">
                          <div className="text-center">
                            <div className="text-xs text-gray-400 mb-1">Total Streams</div>
                            <div className="font-bold text-xs sm:text-sm text-blue-400">
                              {formatNumber(track.spotontrack_data.streams.total)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-400 mb-1">Monthly Streams</div>
                            <div className="font-bold text-xs sm:text-sm text-green-400">
                              {formatNumber(track.spotontrack_data.streams.monthly)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-400 mb-1">Playlists</div>
                            <div className="font-bold text-xs sm:text-sm text-purple-400">
                              {formatNumber(track.spotontrack_data.playlists.total)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-400 mb-1">Virality Score</div>
                            <div className="font-bold text-xs sm:text-sm text-orange-400">
                              {track.spotontrack_data.marketData.virality_score}/100
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tracks.length === 0 && !loading && artistName && (
        <Card className="card-dark">
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No tracks found</h3>
            <p className="text-gray-400">
              Try searching for a different artist or check the spelling
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
