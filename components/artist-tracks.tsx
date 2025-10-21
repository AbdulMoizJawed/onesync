"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { OptimizedImage } from "@/components/optimized-image"
import { Music, ChevronRight } from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"

interface ArtistTracksProps {
  artistName: string
  onTrackClick: (track: any) => void
}

export function ArtistTracks({ artistName, onTrackClick }: ArtistTracksProps) {
  const [loading, setLoading] = useState(true)
  const [tracks, setTracks] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchArtistTracks = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/artist/tracks?name=${encodeURIComponent(artistName)}`)
        
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setTracks(data.data)
          } else {
            setError(data.message || 'Failed to load artist tracks')
          }
        } else {
          setError('Failed to load artist tracks. Please try again.')
        }
      } catch (error) {
        console.error('Error loading artist tracks:', error)
        setError('An unexpected error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchArtistTracks()
  }, [artistName])

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CustomLoader size="lg" />
        <span className="ml-3 text-gray-400">Loading tracks...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Music className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-white font-medium mb-2">Error Loading Tracks</h3>
        <p className="text-gray-400">{error}</p>
      </div>
    )
  }

  if (!tracks.length) {
    return (
      <div className="text-center py-12">
        <Music className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-white font-medium mb-2">No Tracks Found</h3>
        <p className="text-gray-400">We couldn't find any tracks for this artist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {tracks.map((track) => (
          <div
            key={track.id}
            onClick={() => onTrackClick({
              id: track.id,
              type: 'track',
              name: track.name,
              artist: artistName,
              imageUrl: track.album?.images?.[0]?.url,
              genres: [],
              popularityScore: track.popularity || 0,
              duration: track.duration_ms,
              album: track.album?.name
            })}
            className="flex items-center gap-4 p-4 bg-gray-800/40 hover:bg-gray-800/60 rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.01] border border-gray-700/50 hover:border-gray-600/70 hover:shadow-md"
          >
              <div className="w-14 h-14 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {track.album?.images?.[0]?.url ? (
                <OptimizedImage
                  src={track.album.images[0].url}
                  alt={track.name}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="w-7 h-7 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-medium text-white truncate mb-1" title={track.name}>
                {track.name}
              </h4>
              <p className="text-sm text-gray-400 truncate" title={track.album?.name || ''}>
                {track.album?.name || ''}
              </p>
            </div>
            
            <div className="flex items-center gap-6 flex-shrink-0">
              <div className="text-right">
                <div className="text-sm font-medium text-white mb-1">
                  {track.popularity || 0}/100
                </div>
                <div className="text-xs text-gray-400">
                  {track.duration_ms ? formatDuration(track.duration_ms) : '3:45'}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
