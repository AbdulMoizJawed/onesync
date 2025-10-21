"use client"

import { useState, useEffect, useRef } from "react"
import Image from 'next/image'
import { Search, ExternalLink, Music, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { ArtistSearchResult } from "@/lib/music-apis"

interface ArtistSearchProps {
  onArtistSelect?: (artist: ArtistSearchResult) => void
  placeholder?: string
  className?: string
}

export function ArtistSearch({ onArtistSelect, placeholder = "Search for artist...", className = "" }: ArtistSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<ArtistSearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const searchTimeoutRef = useRef<number | null>(null)

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current)
    }
    if (searchTerm.trim().length < 2) {
      setSearchResult(null)
      setError(null)
      return
    }

    const timeout = window.setTimeout(() => {
      searchArtist(searchTerm.trim())
    }, 500) // Wait 500ms after user stops typing

    searchTimeoutRef.current = timeout

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  const searchArtist = async (artistName: string) => {
    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch(`/api/search/artist?name=${encodeURIComponent(artistName)}`)
      
      if (!response.ok) {
        // Try to parse error response
        try {
          const errorData = await response.json()
          setError(errorData.error || `Search failed with status ${response.status}`)
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          setError(`Search failed with status ${response.status}`)
        }
        setSearchResult(null)
        return
      }

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError)
        setError('Invalid response format from search API')
        setSearchResult(null)
        return
      }

      if (data.success && data.artist) {
        setSearchResult(data.artist)
      } else {
        setError(data.error || 'Artist not found')
        setSearchResult(null)
      }
    } catch (err) {
      console.error('Artist search error:', err)
      setError(err instanceof Error ? err.message : 'Failed to search artist')
      setSearchResult(null)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectArtist = () => {
    if (searchResult && onArtistSelect) {
      onArtistSelect(searchResult)
    }
  }

  const formatFollowers = (followers: number) => {
    if (followers >= 1000000) {
      return `${(followers / 1000000).toFixed(1)}M`
    } else if (followers >= 1000) {
      return `${(followers / 1000).toFixed(1)}K`
    }
    return followers.toString()
  }

  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-12 h-10 sm:h-auto text-sm sm:text-base"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Result */}
      {searchResult && (
        <Card className="border-purple-500/20 bg-gradient-to-r from-purple-900/10 to-pink-900/10 animate-fade-in-up">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Artist Image */}
              {searchResult.image && (
                <div className="flex-shrink-0">
                      <Image
                        src={searchResult.image}
                        alt={searchResult.name}
                        width={64}
                        height={64}
                        className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg object-cover"
                        unoptimized
                      />
                </div>
              )}

              {/* Artist Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                  {searchResult.name}
                </h3>

                {/* Followers */}
                {searchResult.followers && (
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="h-3 h-3 sm:h-4 sm:w-4 text-gray-400" />
                    <span className="text-xs sm:text-sm text-gray-400">
                      {formatFollowers(searchResult.followers)} followers
                    </span>
                  </div>
                )}

                {/* Genres */}
                {searchResult.genres && searchResult.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {searchResult.genres.slice(0, 3).map((genre) => (
                      <Badge
                        key={genre}
                        className="text-xs bg-gray-700/50 text-gray-300 px-2 py-0.5"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Platform Links */}
                <div className="flex items-center gap-2 mt-3">
                  {searchResult.spotifyUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                    >
                      <a
                        href={searchResult.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <Music className="h-3 w-3" />
                        Spotify
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Select Button */}
              <div className="flex-shrink-0">
                <Button
                  onClick={handleSelectArtist}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Select Artist
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
