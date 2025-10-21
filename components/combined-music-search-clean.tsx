"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Search, ExternalLink, Music, Users, TrendingUp, 
  Globe, Play, Heart, Share2, Star,
  Headphones, Clock, AlertCircle, Info, ChevronLeft
} from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"
import { TrackDetails } from "@/components/track-details"
import { ArtistTracks } from "@/components/artist-tracks"

interface SearchResult {
  id: string
  name: string
  type: 'artist' | 'track' | 'album'
  imageUrl: string
  artist?: string
  album?: string
  releaseDate?: string
  genres: string[]
  popularityScore: number
  followers?: number
  duration?: number // For tracks
}

interface CombinedData {
  name: string
  imageUrl: string
  genres: string[]
  popularityScore: number
  followers?: {
    total: number
  }
  socialLinks: {
    spotify?: string
    website?: string
  }
  streams?: {
    total: number
    monthly: number
    daily: number
  }
}

interface EnrichedArtistData {
  combined: CombinedData
}

export function CombinedMusicSearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState<'artist' | 'track' | 'album'>('artist')
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedArtist, setSelectedArtist] = useState<EnrichedArtistData | null>(null)
  const [selectedTrack, setSelectedTrack] = useState<SearchResult | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [apiStatus, setApiStatus] = useState<{
    spotify: boolean
    spotontrack: boolean
  }>({ spotify: false, spotontrack: false })

  // Check API status on mount
  useEffect(() => {
    checkApiStatus()
  }, [])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const checkApiStatus = async () => {
    try {
      const response = await fetch('/api/status')
      if (response.ok) {
        const status = await response.json()
        setApiStatus({
          spotify: status.spotify || false,
          spotontrack: status.spotontrack || false
        })
      }
    } catch (error) {
      console.error('Failed to check API status:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    try {
      setLoading(true)
      setSearchResults([])
      setSelectedArtist(null)
      setSelectedTrack(null)
      setShowProfile(false)
      setError(null)
      setHasSearched(true)

      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&type=${searchType}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.results && data.results.length > 0) {
          const results = data.results
          setSearchResults(results)
          
          // For artists, if there's only one result that closely matches the search term,
          // auto-navigate to that artist
          if (searchType === 'artist') {
            const exactMatch = results.find((r: SearchResult) => 
              r.type === 'artist' && 
              r.name.toLowerCase() === searchTerm.toLowerCase()
            )
            
            if (exactMatch) {
              handleArtistClick(exactMatch)
              return
            }
          }
          
          // For tracks, handle single result navigation
          if (searchType === 'track') {
            const trackResults = results.filter((r: SearchResult) => r.type === 'track')
            
            // Only auto-navigate to a track if there's only one track result and no artist results
            const artistResults = results.filter((r: SearchResult) => r.type === 'artist')
            if (trackResults.length === 1 && artistResults.length === 0) {
              // Navigate directly to the only track result if there are no artist results
              handleTrackClick(trackResults[0])
            }
            
            // For artists, always show the search results with clickable items
            // This allows users to see multiple artists that match their search
          }
        } else {
          setError('No results found. Try a different search term.')
        }
      } else {
        setError('Search failed. Please try again.')
      }
    } catch (error) {
      console.error('Search error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleArtistClick = async (result: SearchResult | string) => {
    try {
      setLoadingProfile(true)
      setError(null)
      
      // If result is a string (artist name), convert it to a SearchResult
      const artistName = typeof result === 'string' 
        ? result 
        : result.name.replace(' (Alternative)', '')
      
      const response = await fetch(`/api/artist/enriched?name=${encodeURIComponent(artistName)}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSelectedArtist(data.data)
          setSelectedTrack(null) // Make sure track is cleared when viewing artist
          setShowProfile(true)
        } else {
          setError(data.message || 'Failed to load artist profile')
        }
      } else {
        setError('Failed to load artist profile. Please try again.')
      }
    } catch (error) {
      console.error('Profile load error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleBackToResults = () => {
    setShowProfile(false)
    setSelectedArtist(null)
    setSelectedTrack(null)
  }

  const handleTrackClick = (track: SearchResult) => {
    setSelectedTrack(track)
    setSelectedArtist(null) // Make sure artist is cleared when viewing a track
    setShowProfile(true)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* API Status Alert */}
        {!apiStatus.spotify && (
          <Alert className="border-yellow-500/20 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              <strong>Limited functionality:</strong> Some music services are currently unavailable. 
              Search results may be limited.
            </AlertDescription>
          </Alert>
        )}

        {/* Search Interface */}
        <Card className="bg-gray-800/90 border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search for artists, tracks, or albums..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-lg h-12"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSearch}
                  disabled={loading || !searchTerm.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <CustomLoader size="sm" />
                      <span>Searching...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      <span>Search</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>

            {/* Search Type Selector */}
            <div className="flex gap-1 mt-4">
              {(['artist', 'track', 'album'] as const).map((type) => (
                <Button
                  key={type}
                  variant={searchType === type ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSearchType(type)}
                  className={`text-xs ${
                    searchType === type 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert className="border-red-500/20 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Search Results */}
        {!showProfile && searchResults.length > 0 && (
          <Card className="bg-gray-800/90 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-base">
                Search Results ({searchResults.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((result) => (
                  <Card
                    key={result.id}
                    className="bg-gray-700/50 border-gray-600 hover:bg-gray-700/70 transition-colors cursor-pointer"
                    onClick={() => {
                      if (result.type === 'artist') {
                        handleArtistClick(result)
                      } else if (result.type === 'track') {
                        handleTrackClick(result)
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 ring-1 ring-gray-600">
                          <AvatarImage src={result.imageUrl} alt={result.name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {result.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium text-sm truncate">
                            {result.name}
                          </h3>
                          {result.artist && (
                            <p className="text-gray-400 text-xs truncate">
                              by {result.artist}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="border-gray-500 text-gray-300 text-xs px-1.5 py-0">
                              {result.type}
                            </Badge>
                            {result.popularityScore && (
                              <div className="flex items-center text-xs">
                                <Star className="w-3 h-3 text-yellow-400 mr-1" />
                                <span className="text-white">{result.popularityScore}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Artist Profile View with Slide Animation */}
        {showProfile && selectedArtist && !selectedTrack && (
          <div className="relative overflow-hidden">
            <div className={`transition-transform duration-500 ease-in-out ${showProfile ? 'translate-x-0' : 'translate-x-full'}`}>
              <Card className="bg-gray-800/90 border-gray-700">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToResults}
                      className="text-gray-400 hover:text-white h-8 px-2"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                    <div className="flex-1">
                      <CardTitle className="text-white text-base">
                        {selectedArtist.combined.name}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingProfile ? (
                    <div className="flex items-center justify-center py-8">
                      <CustomLoader size="md" />
                      <span className="ml-2 text-gray-400 text-sm">Loading...</span>
                    </div>
                  ) : (
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="w-full bg-gray-800 grid grid-cols-3">
                        <TabsTrigger value="overview" className="text-white text-xs">
                          Overview
                        </TabsTrigger>
                        <TabsTrigger value="tracks" className="text-white text-xs">
                          Tracks
                        </TabsTrigger>
                        <TabsTrigger value="streams" className="text-white text-xs">
                          Stats
                        </TabsTrigger>
                      </TabsList>

                      {/* Tracks Tab */}
                      <TabsContent value="tracks" className="space-y-6">
                        <div className="space-y-4">
                          <ArtistTracks artistName={selectedArtist.combined.name} onTrackClick={handleTrackClick} />
                        </div>
                      </TabsContent>

                      {/* Overview Tab */}
                      <TabsContent value="overview" className="space-y-6">
                        {/* Artist Header */}
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-lg border border-gray-700/50">
                          <Avatar className="w-16 h-16 ring-2 ring-gray-600">
                            <AvatarImage src={selectedArtist.combined.imageUrl} alt={selectedArtist.combined.name} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                              {selectedArtist.combined.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h1 className="text-xl font-bold text-white mb-1">
                              {selectedArtist.combined.name}
                            </h1>
                            {selectedArtist.combined.genres.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {selectedArtist.combined.genres.slice(0, 2).map((genre: string, index: number) => (
                                  <Badge key={index} variant="outline" className="border-gray-500 text-gray-300 text-xs px-1.5 py-0">
                                    {genre}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center text-sm">
                              <Star className="w-3 h-3 text-yellow-400 mr-1" />
                              <span className="text-white text-xs mr-2">{selectedArtist.combined.popularityScore}</span>
                              {selectedArtist.combined.followers && (
                                <>
                                  <Heart className="w-3 h-3 text-pink-400 mr-1 ml-2" />
                                  <span className="text-white text-xs">{formatNumber(selectedArtist.combined.followers.total)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {selectedArtist.combined.socialLinks.spotify && (
                            <a
                              href={selectedArtist.combined.socialLinks.spotify}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1 p-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex-1"
                            >
                              <Play className="w-4 h-4" />
                              <span className="text-sm">Spotify</span>
                            </a>
                          )}
                          {selectedArtist.combined.socialLinks.website && (
                            <a
                              href={selectedArtist.combined.socialLinks.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex-1"
                            >
                              <Globe className="w-4 h-4" />
                              <span className="text-sm">Website</span>
                            </a>
                          )}
                          <button className="flex items-center justify-center gap-1 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors flex-1">
                            <Share2 className="w-4 h-4" />
                            <span className="text-sm">Share</span>
                          </button>
                        </div>
                      </TabsContent>

                      {/* Streams Tab */}
                      <TabsContent value="streams" className="space-y-6">
                        {selectedArtist.combined.streams ? (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 border-green-500/20">
                                <CardContent className="p-6 text-center">
                                  <Headphones className="w-12 h-12 text-green-400 mx-auto mb-4" />
                                  <div className="text-3xl font-bold text-white mb-2">
                                    {formatNumber(selectedArtist.combined.streams.total)}
                                  </div>
                                  <p className="text-green-400 font-medium">Total Streams</p>
                                </CardContent>
                              </Card>
                              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-600/5 border-blue-500/20">
                                <CardContent className="p-6 text-center">
                                  <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                                  <div className="text-3xl font-bold text-white mb-2">
                                    {formatNumber(selectedArtist.combined.streams.monthly)}
                                  </div>
                                  <p className="text-blue-400 font-medium">Monthly Streams</p>
                                </CardContent>
                              </Card>
                              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/5 border-purple-500/20">
                                <CardContent className="p-6 text-center">
                                  <Clock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                                  <div className="text-3xl font-bold text-white mb-2">
                                    {formatNumber(selectedArtist.combined.streams.daily)}
                                  </div>
                                  <p className="text-purple-400 font-medium">Daily Streams</p>
                                </CardContent>
                              </Card>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-12">
                            <Headphones className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                            <h3 className="text-white font-medium mb-2">No Streaming Data Available</h3>
                            <p className="text-gray-400">Streaming statistics are not available for this artist.</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {/* Track Details View */}
        {showProfile && selectedTrack && (
          <TrackDetails
            trackId={selectedTrack.id}
            trackName={selectedTrack.name}
            artistName={selectedTrack.artist || ''}
            albumName={selectedTrack.album}
            imageUrl={selectedTrack.imageUrl}
            onBack={handleBackToResults}
            onArtistClick={(artistName) => {
              handleArtistClick(artistName);
            }}
          />
        )}

        {/* Getting Started Guide */}
        {!hasSearched && !showProfile && (
          <Card className="bg-gray-800/90 border-gray-700 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-gray-300">
                <p className="text-center">
                  Search for your favorite artists and tracks to explore comprehensive music data.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
                    <Search className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-medium mb-1">Artist Search</h4>
                      <p className="text-sm text-gray-400">Find artists and view their Spotify stats, tracks, and more.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
                    <Music className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-medium mb-1">Track Search</h4>
                      <p className="text-sm text-gray-400">Discover tracks and explore detailed playlist information.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
