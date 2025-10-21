"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertCircle,
  ChevronDown,
  ChevronRight, 
  Clock, 
  Disc3, 
  ExternalLink, 
  Globe, 
  GripHorizontal, 
  Music, 
  MusicIcon, 
  Play, 
  RotateCcw, 
  Search, 
  Share2, 
  Star, 
  User, 
  Users, 
  Headphones,
  BarChart3,
  TrendingUp,
  Heart,
  Info,
  ChevronLeft
} from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"
import { spotontrackApi } from "@/lib/spotontrack-api"
import { debounce } from "@/lib/performance"

interface SearchResult {
  id: string
  name: string
  type: 'artist' | 'track'
  imageUrl: string
  artist?: string
  album?: string
  releaseDate?: string
  genres: string[]
  popularityScore: number
  followers?: number
  duration?: number // For tracks
  streams?: {
    total: {
      total: number
      monthly: number
      daily: number
    }
  }
  marketData?: {
    popularity: number
    trend: string
    trendPercentage: number
    industry_rank: number
  }
  hasSpotonTrackData?: boolean
}

interface SpotOnTrackArtistData {
  id: string
  name: string
  imageUrl: string
  genres: string[]
  popularityScore: number
  followers?: {
    total: number
    spotify?: number
    instagram?: number
    twitter?: number
    facebook?: number
    youtube?: number
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
  playlists?: {
    total: number
    editorial: number
    userGenerated: number
    spotifyPlaylists: Array<{
      name: string
      followers: number
      url: string
    }>
  }
  chartPerformance?: {
    peakPosition: number
    currentPosition: number
    weeksOnChart: number
    countries: string[]
  }
  demographics?: {
    topCountries: Array<{ country: string; percentage: number }>
    ageGroups: Array<{ range: string; percentage: number }>
    gender: { male: number; female: number; other: number }
  }
  marketData?: {
    popularity: number
    trend: string
    trendPercentage: number
    industry_rank: number
  }
  hasSpotonTrackData: boolean
  tracks?: Array<{
    id: string
    title: string
    artist: string
    album?: string
    duration: number
    popularity: number
    preview_url?: string
    spotify_url?: string
    image?: string
  }>
}

interface SpotOnTrackData {
  artist_stats: any
  recent_tracks: any[]
  radio_info: any
  chart_positions?: Record<string, number>
  chart_history?: Array<{date: string, position: number, chart: string}>
  streams?: {
    total: number
    monthly: number
    daily: number
  }
  playlists?: {
    total: number
    editorial: number
    userGenerated: number
    spotifyPlaylists: Array<{
      name: string
      followers: number
      url: string
    }>
  }
}

const api = spotontrackApi;

function SpotOnTrackMusicSearchComponent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedArtist, setSelectedArtist] = useState<SpotOnTrackArtistData | null>(null)
  const [selectedTrack, setSelectedTrack] = useState<SearchResult | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [apiStatus, setApiStatus] = useState<{
    spotontrack: boolean
  }>({ spotontrack: false })
  
  // SpotOnTrack specific data states
  const [streamsData, setStreamsData] = useState<Array<{
    name: string, 
    value: number, 
    platform?: string, 
    trend?: 'up' | 'down' | 'stable', 
    isPercentage?: boolean
  }>>([])
  const [playlistsData, setPlaylistsData] = useState<Array<{
    name: string, 
    followers: number, 
    position: string | number,
    url?: string,
    type?: string
  }>>([])
  const [analyticsData, setAnalyticsData] = useState<{
    chart_positions?: Record<string, number>,
    chart_history?: Array<{date: string, position: number, chart: string}>
  }>({})

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

  const checkApiStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/status')
      if (response.ok) {
        const status = await response.json()
        setApiStatus({
          spotontrack: status.spotontrack || false
        })
      }
    } catch (error) {
      console.error('Failed to check API status:', error)
    }
  }, [])

  // Check API status on mount
  useEffect(() => {
    checkApiStatus()
  }, [checkApiStatus])

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return

    try {
      setLoading(true)
      setSearchResults([])
      setSelectedArtist(null)
      setSelectedTrack(null)
      setShowProfile(false)
      setError(null)
      setHasSearched(true)

      // Use SpotOnTrack API to search for artists
      const artists = await spotontrackApi.searchArtist(searchTerm, 10)
      
      if (artists && artists.length > 0) {
    const results: SearchResult[] = artists.map((artist: any) => ({
          id: artist.id,
          name: artist.name,
          type: 'artist' as const,
          imageUrl: artist.image || '',
          genres: [],
          popularityScore: artist.marketData?.popularity || 0,
          followers: artist.followers?.total,
        }))
        setSearchResults(results)
      } else {
        setError('No results found. Try a different search term.')
      }
    } catch (error) {
      console.error('Search error:', error)
      setError(error instanceof Error ? error.message : 'Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

  const handleArtistClick = useCallback(async (result: SearchResult | string) => {
    try {
      setLoadingProfile(true)
      setError(null)
      
      const artistName = typeof result === 'string' 
        ? result 
        : result.name

      // Get detailed artist data from SpotOnTrack API
      const artistData = await spotontrackApi.getArtistDetails(artistName)
      
      if (artistData) {
        const enrichedArtist: SpotOnTrackArtistData = {
          id: String(artistData.id),
          name: artistData.name,
          imageUrl: artistData.image || '',
          genres: [], // SpotOnTrack doesn't provide genres in basic search
          popularityScore: artistData.marketData?.popularity || 0,
          followers: {
            total: artistData.followers?.total || 0,
            spotify: artistData.followers?.spotify || 0,
            instagram: artistData.followers?.instagram || 0,
            twitter: artistData.followers?.twitter || 0,
            facebook: artistData.followers?.facebook || 0,
            youtube: artistData.followers?.youtube || 0
          },
          socialLinks: {
            spotify: undefined, // Can be populated from external_urls if available
            website: undefined
          },
          streams: artistData.streams ? {
            total: typeof artistData.streams === 'number' ? artistData.streams : (artistData.streams as any)?.total || 0,
            monthly: typeof artistData.streams === 'number' ? Math.floor(artistData.streams / 12) : (artistData.streams as any)?.monthly || 0,
            daily: typeof artistData.streams === 'number' ? Math.floor(artistData.streams / 365) : (artistData.streams as any)?.daily || 0
          } : undefined,
          playlists: artistData.playlists ? {
            total: (artistData.playlists as any)?.total || 0,
            editorial: (artistData.playlists as any)?.editorial || 0,
            userGenerated: (artistData.playlists as any)?.userGenerated || 0,
            spotifyPlaylists: (artistData.playlists as any)?.spotifyPlaylists || []
          } : undefined,
          chartPerformance: artistData.chartPerformance,
          demographics: artistData.demographics,
          marketData: artistData.marketData ? {
            popularity: artistData.marketData.popularity || 0,
            trend: (artistData.marketData as any)?.trend || 'stable',
            trendPercentage: (artistData.marketData as any)?.trendPercentage || 0,
            industry_rank: (artistData.marketData as any)?.industry_rank || 0
          } : undefined,
          hasSpotonTrackData: true,
          tracks: [] // We'll populate this with a separate call if needed
        }

        setSelectedArtist(enrichedArtist)
        setSelectedTrack(null)
        setShowProfile(true)
      } else {
        setError('Failed to load artist profile')
      }
    } catch (error) {
      console.error('Profile load error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.')
    } finally {
      setLoadingProfile(false)
    }
  }, [])

  const handleBackToResults = useCallback(() => {
    setShowProfile(false)
    setSelectedArtist(null)
    setSelectedTrack(null)
  }, [])

  const handleTrackClick = useCallback((track: SearchResult) => {
    setSelectedTrack(track)
    setSelectedArtist(null)
    setShowProfile(true)
  }, [])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {!apiStatus.spotontrack && (
          <Alert className="border-yellow-500/20 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              <strong>Limited functionality:</strong> SpotOnTrack API is currently unavailable. 
              <span className="block mt-1">
                <Badge className="bg-red-500/20 text-red-300 border-red-500/30 mr-2">SpotOnTrack API</Badge>
                The SpotOnTrack API is currently unavailable. Analytics and streaming data may be limited.
              </span>
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-gray-800/90 border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search for artists or tracks..."
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
                      <span>SEARCH TRACK OR ARTIST</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>

            {/* Remove the artist/track toggle buttons */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">
                Search for any artist or track in our music database
              </p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert className="border-red-500/20 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

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
                            <Badge variant="outline" className="border-green-500 text-green-300 text-xs px-1.5 py-0">
                              <TrendingUp className="w-2 h-2 mr-1" />
                              SpotOnTrack
                            </Badge>
                          </div>
                          {result.streams?.total && (
                            <p className="text-green-400 text-xs mt-1">
                              <Headphones className="w-3 h-3 inline mr-1" />
                              {formatNumber(result.streams.total.total)} streams
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                        {selectedArtist.name}
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
                      <TabsList className="w-full grid grid-cols-2 sm:grid-cols-5 gap-1 sm:gap-2 mb-4 p-1 bg-gray-800">
                        <TabsTrigger value="overview" className="text-white text-xs sm:text-sm px-2 py-1">
                          Overview
                        </TabsTrigger>
                        <TabsTrigger value="streams" className="text-white text-xs sm:text-sm px-2 py-1">
                          Streams
                        </TabsTrigger>
                        <TabsTrigger value="playlists" className="text-white text-xs sm:text-sm px-2 py-1">
                          Playlists
                        </TabsTrigger>
                        <TabsTrigger value="charts" className="text-white text-xs sm:text-sm px-2 py-1">
                          Charts
                        </TabsTrigger>
                        <TabsTrigger value="demographics" className="text-white text-xs sm:text-sm px-2 py-1">
                          Demographics
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="md:w-1/4">
                            <Avatar className="w-full h-auto aspect-square rounded-lg max-w-[180px]">
                              <AvatarImage src={selectedArtist.imageUrl} alt={selectedArtist.name} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {selectedArtist.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="md:w-3/4">
                            <h2 className="text-xl font-bold text-white">{selectedArtist.name}</h2>
                            {selectedArtist.genres?.length > 0 && (
                              <div className="flex flex-wrap gap-2 my-2">
                                {selectedArtist.genres.map((genre, index) => (
                                  <Badge key={index} className="bg-gray-700 text-blue-300">
                                    {genre}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-2 mt-4">
                              <div className="bg-gray-800/50 p-3 rounded-lg">
                                <p className="text-gray-400 text-xs">Popularity</p>
                                <p className="text-xl font-bold text-white">{selectedArtist.popularityScore || 'N/A'}</p>
                              </div>
                              <div className="bg-gray-800/50 p-3 rounded-lg">
                                <p className="text-gray-400 text-xs">Followers</p>
                                <p className="text-xl font-bold text-white">
                                  {selectedArtist.followers?.total 
                                    ? formatNumber(selectedArtist.followers.total) 
                                    : 'N/A'}
                                </p>
                              </div>
                            </div>
                            {selectedArtist.socialLinks && (
                              <div className="flex gap-2 mt-4">
                                {selectedArtist.socialLinks.spotify && (
                                  <Button variant="outline" size="sm" className="text-xs" asChild>
                                    <a href={selectedArtist.socialLinks.spotify} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      Spotify
                                    </a>
                                  </Button>
                                )}
                                {selectedArtist.socialLinks.website && (
                                  <Button variant="outline" size="sm" className="text-xs" asChild>
                                    <a href={selectedArtist.socialLinks.website} target="_blank" rel="noopener noreferrer">
                                      <Globe className="w-3 h-3 mr-1" />
                                      Website
                                    </a>
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="tracks" className="space-y-4">
                        {selectedArtist.tracks && selectedArtist.tracks.length > 0 ? (
                          <div className="space-y-3">
                            <h4 className="text-white font-medium flex items-center">
                              <Music className="w-5 h-5 mr-2 text-blue-400" />
                              Popular Tracks ({selectedArtist.tracks.length})
                            </h4>
                            <div className="space-y-2">
                              {selectedArtist.tracks.map((track, index) => (
                                <div 
                                  key={track.id} 
                                  className="bg-gray-800/50 p-3 rounded-lg hover:bg-gray-800/70 transition-colors cursor-pointer group"
                                  onClick={() => track.spotify_url && window.open(track.spotify_url, '_blank')}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-12 h-12 bg-gray-700 rounded-lg overflow-hidden">
                                      {track.image ? (
                                        <Image src={track.image} alt={track.title} width={48} height={48} className="w-full h-full object-cover" unoptimized />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <Music className="w-6 h-6 text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-white font-medium truncate group-hover:text-blue-400 transition-colors">
                                        {track.title}
                                      </h5>
                                      <p className="text-gray-400 text-sm truncate">
                                        {track.album}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                      <div className="text-center">
                                        <p className="text-xs">Popularity</p>
                                        <p className="text-white font-medium">{track.popularity}%</p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-xs">Duration</p>
                                        <p className="text-white font-medium">
                                          {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                                        </p>
                                      </div>
                                      {track.spotify_url && (
                                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No tracks available</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="streams" className="space-y-6">
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <CustomLoader size="md" />
                            <span className="ml-2 text-gray-400 text-sm">Loading streams data...</span>
                          </div>
                        ) : streamsData && streamsData.length > 0 ? (
                          <div className="space-y-4">
                            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 border-green-500/20">
                              <CardContent className="p-6">
                                <h4 className="text-white font-medium mb-4 flex items-center">
                                  <Headphones className="w-5 h-5 mr-2 text-green-400" />
                                  Streaming Data (SpotOnTrack)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {streamsData.map((stream, index) => (
                                    <div 
                                      key={index} 
                                      className={`bg-gray-800/30 p-4 rounded-lg text-center ${
                                        stream.trend === 'up' ? 'border-l-2 border-green-500/50' :
                                        stream.trend === 'down' ? 'border-l-2 border-red-500/50' :
                                        'border-l-2 border-blue-500/50'
                                      }`}
                                    >
                                      <div className="flex items-center justify-center mb-2">
                                        <p className="text-gray-400 text-sm">{stream.name}</p>
                                        {stream.trend === 'up' && (
                                          <svg className="w-4 h-4 ml-1 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M5 15l7-7 7 7" />
                                          </svg>
                                        )}
                                        {stream.trend === 'down' && (
                                          <svg className="w-4 h-4 ml-1 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 9l-7 7-7-7" />
                                          </svg>
                                        )}
                                        {stream.trend === 'stable' && (
                                          <svg className="w-4 h-4 ml-1 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M5 12h14" />
                                          </svg>
                                        )}
                                      </div>
                                      <p className={`text-2xl font-bold ${
                                        stream.trend === 'up' ? 'text-green-400' :
                                        stream.trend === 'down' ? 'text-red-400' :
                                        'text-blue-400'
                                      }`}>
                                        {stream.isPercentage ? `${stream.value}%` : formatNumber(stream.value)}
                                      </p>
                                      {stream.trend && (
                                        <p className="text-gray-400 text-xs mt-1">
                                          {stream.trend === 'up' ? 'Growing' : 
                                           stream.trend === 'down' ? 'Declining' : 'Stable'}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-400">No streaming data available from SpotOnTrack.</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="playlists" className="space-y-6">
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <CustomLoader size="md" />
                            <span className="ml-2 text-gray-400 text-sm">Loading playlist data...</span>
                          </div>
                        ) : playlistsData && playlistsData.length > 0 ? (
                          <div className="space-y-4">
                            <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-600/5 border-blue-500/20">
                              <CardContent className="p-6">
                                <h4 className="text-white font-medium mb-4 flex items-center">
                                  <Music className="w-5 h-5 mr-2 text-blue-400" />
                                  Playlists Data (SpotOnTrack) ({playlistsData.length || 0})
                                </h4>
                                
                                {playlistsData.some(p => p.type === 'stat') && (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    {playlistsData
                                      .filter(p => p.type === 'stat')
                                      .map((stat, index) => (
                                        <div key={`stat-${index}`} className="bg-gray-800/30 p-4 rounded-lg text-center">
                                          <p className="text-gray-400 text-sm">{stat.name}</p>
                                          <p className="text-2xl font-bold text-blue-400">{formatNumber(stat.followers)}</p>
                                        </div>
                                      ))
                                    }
                                  </div>
                                )}
                                
                                <div className="space-y-3">
                                  {playlistsData
                                    .filter(p => p.type !== 'stat')
                                    .slice(0, 10)
                                    .map((playlist, index) => (
                                      <div 
                                        key={`playlist-${index}`} 
                                        className="bg-gray-800/30 p-3 rounded-lg flex items-center justify-between border-l-2 border-blue-500/50"
                                      >
                                        <div>
                                          <div className="flex items-center">
                                            <p className="text-white font-medium">{playlist.name}</p>
                                          </div>
                                          <p className="text-gray-400 text-sm">
                                            Position: {playlist.position || 'N/A'}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-blue-400 font-medium">
                                            {formatNumber(playlist.followers || 0)}
                                          </p>
                                          <p className="text-gray-400 text-xs">followers</p>
                                          {playlist.url && (
                                            <a 
                                              href={playlist.url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-xs text-gray-400 hover:text-white inline-flex items-center mt-1"
                                            >
                                              <ExternalLink className="w-3 h-3 mr-1" />
                                              View
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  }
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-400">No playlist data available from SpotOnTrack.</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="streams" className="space-y-4">
                        {selectedArtist.streams ? (
                          <div className="space-y-4">
                            <h4 className="text-white font-medium flex items-center">
                              <Headphones className="w-5 h-5 mr-2 text-green-400" />
                              Streaming Statistics
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                                <p className="text-gray-400 text-sm">Total Streams</p>
                                <p className="text-2xl font-bold text-green-400">{formatNumber(selectedArtist.streams.total)}</p>
                              </div>
                              <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                                <p className="text-gray-400 text-sm">Monthly Streams</p>
                                <p className="text-2xl font-bold text-blue-400">{formatNumber(selectedArtist.streams.monthly)}</p>
                              </div>
                              <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                                <p className="text-gray-400 text-sm">Daily Streams</p>
                                <p className="text-2xl font-bold text-purple-400">{formatNumber(selectedArtist.streams.daily)}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Headphones className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No streaming data available</p>
                            <p className="text-gray-500 text-sm mt-2">Requires valid SpotOnTrack API key</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="playlists" className="space-y-4">
                        {selectedArtist.playlists ? (
                          <div className="space-y-4">
                            <h4 className="text-white font-medium flex items-center">
                              <Music className="w-5 h-5 mr-2 text-blue-400" />
                              Playlist Analytics
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                              <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                                <p className="text-gray-400 text-sm">Total Playlists</p>
                                <p className="text-2xl font-bold text-blue-400">{selectedArtist.playlists.total}</p>
                              </div>
                              <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                                <p className="text-gray-400 text-sm">Editorial Playlists</p>
                                <p className="text-2xl font-bold text-green-400">{selectedArtist.playlists.editorial}</p>
                              </div>
                              <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                                <p className="text-gray-400 text-sm">User Playlists</p>
                                <p className="text-2xl font-bold text-purple-400">{selectedArtist.playlists.userGenerated}</p>
                              </div>
                            </div>
                            {selectedArtist.playlists.spotifyPlaylists && selectedArtist.playlists.spotifyPlaylists.length > 0 && (
                              <div>
                                <h5 className="text-white font-medium mb-3">Top Spotify Playlists</h5>
                                <div className="space-y-2">
                                  {selectedArtist.playlists.spotifyPlaylists.map((playlist, index) => (
                                    <div key={index} className="bg-gray-800/50 p-3 rounded-lg flex justify-between items-center">
                                      <div>
                                        <p className="text-white font-medium">{playlist.name}</p>
                                        <p className="text-gray-400 text-sm">{formatNumber(playlist.followers)} followers</p>
                                      </div>
                                      {playlist.url && (
                                        <Button variant="outline" size="sm" asChild>
                                          <a href={playlist.url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-4 h-4" />
                                          </a>
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No playlist data available</p>
                            <p className="text-gray-500 text-sm mt-2">Requires valid SpotOnTrack API key</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="charts" className="space-y-4">
                        {selectedArtist.chartPerformance ? (
                          <div className="space-y-4">
                            <h4 className="text-white font-medium flex items-center">
                              <BarChart3 className="w-5 h-5 mr-2 text-yellow-400" />
                              Chart Performance
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                              <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                                <p className="text-gray-400 text-sm">Peak Position</p>
                                <p className="text-2xl font-bold text-yellow-400">#{selectedArtist.chartPerformance.peakPosition}</p>
                              </div>
                              <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                                <p className="text-gray-400 text-sm">Current Position</p>
                                <p className="text-2xl font-bold text-blue-400">#{selectedArtist.chartPerformance.currentPosition}</p>
                              </div>
                              <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                                <p className="text-gray-400 text-sm">Weeks on Chart</p>
                                <p className="text-2xl font-bold text-green-400">{selectedArtist.chartPerformance.weeksOnChart}</p>
                              </div>
                            </div>
                            {selectedArtist.chartPerformance.countries && selectedArtist.chartPerformance.countries.length > 0 && (
                              <div>
                                <h5 className="text-white font-medium mb-3">Chart Countries</h5>
                                <div className="flex flex-wrap gap-2">
                                  {selectedArtist.chartPerformance.countries.map((country, index) => (
                                    <Badge key={index} className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                                      {country}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No chart data available</p>
                            <p className="text-gray-500 text-sm mt-2">Requires valid SpotOnTrack API key</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="demographics" className="space-y-4">
                        {selectedArtist.demographics ? (
                          <div className="space-y-6">
                            <h4 className="text-white font-medium flex items-center">
                              <Users className="w-5 h-5 mr-2 text-purple-400" />
                              Audience Demographics
                            </h4>
                            
                            {selectedArtist.demographics.topCountries && selectedArtist.demographics.topCountries.length > 0 && (
                              <div>
                                <h5 className="text-white font-medium mb-3">Top Countries</h5>
                                <div className="space-y-2">
                                  {selectedArtist.demographics.topCountries.map((country, index) => (
                                    <div key={index} className="bg-gray-800/50 p-3 rounded-lg flex justify-between items-center">
                                      <p className="text-white">{country.country}</p>
                                      <div className="flex items-center gap-2">
                                        <div className="w-20 bg-gray-700 rounded-full h-2">
                                          <div 
                                            className="bg-purple-400 h-2 rounded-full" 
                                            style={{ width: `${country.percentage}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-purple-400 font-medium">{country.percentage}%</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {selectedArtist.demographics.ageGroups && selectedArtist.demographics.ageGroups.length > 0 && (
                              <div>
                                <h5 className="text-white font-medium mb-3">Age Groups</h5>
                                <div className="space-y-2">
                                  {selectedArtist.demographics.ageGroups.map((age, index) => (
                                    <div key={index} className="bg-gray-800/50 p-3 rounded-lg flex justify-between items-center">
                                      <p className="text-white">{age.range}</p>
                                      <div className="flex items-center gap-2">
                                        <div className="w-20 bg-gray-700 rounded-full h-2">
                                          <div 
                                            className="bg-blue-400 h-2 rounded-full" 
                                            style={{ width: `${age.percentage}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-blue-400 font-medium">{age.percentage}%</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {selectedArtist.demographics.gender && (
                              <div>
                                <h5 className="text-white font-medium mb-3">Gender Distribution</h5>
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                                    <p className="text-gray-400 text-sm">Male</p>
                                    <p className="text-2xl font-bold text-blue-400">{selectedArtist.demographics.gender.male}%</p>
                                  </div>
                                  <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                                    <p className="text-gray-400 text-sm">Female</p>
                                    <p className="text-2xl font-bold text-pink-400">{selectedArtist.demographics.gender.female}%</p>
                                  </div>
                                  <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                                    <p className="text-gray-400 text-sm">Other</p>
                                    <p className="text-2xl font-bold text-purple-400">{selectedArtist.demographics.gender.other}%</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No demographic data available</p>
                            <p className="text-gray-500 text-sm mt-2">Requires valid SpotOnTrack API key</p>
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

        {!hasSearched && !showProfile && (
          <Card className="bg-gray-800/90 border-gray-700 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                SpotOnTrack Music Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-gray-300">
                <p className="text-center">
                  Search for artists and tracks to explore professional music analytics powered by SpotOnTrack.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
                    <Search className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-medium mb-1">Artist Analytics</h4>
                      <p className="text-sm text-gray-400">Get streaming data, chart positions, and market insights.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
                    <Music className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-medium mb-1">Track Performance</h4>
                      <p className="text-sm text-gray-400">Analyze track streaming stats and playlist performance.</p>
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

export const SpotOnTrackMusicSearch = memo(SpotOnTrackMusicSearchComponent)
