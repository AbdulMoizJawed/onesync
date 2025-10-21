"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
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
import { TrackDetails } from "@/components/track-details-updated"
import { ArtistTracks } from "@/components/artist-tracks"
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
  marketData?: {
    popularity: number
    trend: string
    trendPercentage: number
    industry_rank: number
  }
  hasSpotonTrackData?: boolean
}

interface EnrichedArtistData {
  // Basic Spotify data
  spotify?: {
    id: string
    name: string
    images: Array<{ url: string; height: number; width: number }>
    genres: string[]
    followers: { total: number }
    popularity: number
    external_urls: { spotify: string }
  }
  
  // MUSO industry data
  muso?: {
    profile: any
    credits: any[]
    collaborators: any[]
    charts: any[]
  }
  
  // SpotonTrack industry stats
  spotontrack?: {
    artist_stats: any
    recent_tracks: any[]
    radio_info: any
  }
  
  // Combined enriched data
  combined: CombinedData
}

const api = spotontrackApi;

function CombinedMusicSearchComponent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState<'artist' | 'track'>('artist')
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
    muso: boolean
    spotontrack: boolean
  }>({ spotify: false, muso: false, spotontrack: false })
  
  // Streams, Playlists, and Analytics data states
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
  const [collaboratorsData, setCollaboratorsData] = useState<Array<{name: string, role: string, collaborationCount: number, imageUrl?: string}>>([])
  const [creditsData, setCreditsData] = useState<Array<{title: string, role: string, date: string, album?: string}>>([])
  const [analyticsData, setAnalyticsData] = useState<{
    chart_positions?: Record<string, number>,
    chart_history?: Array<{date: string, position: number, chart: string}>
  }>({})

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

  const checkApiStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/status')
      if (response.ok) {
        const status = await response.json()
        setApiStatus({
          spotify: status.spotify || false,
          muso: status.muso || false,
          spotontrack: status.spotontrack || false
        })
      }
    } catch (error) {
      console.error('Failed to check API status:', error)
    }
  }, [])

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

      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&type=${searchType}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.results && data.results.length > 0) {
          const results = data.results
          setSearchResults(results)
          
          // For artists, auto-navigate to the first result after showing search results briefly
          if (searchType === 'artist') {
            const exactMatch = results.find((r: SearchResult) => 
              r.type === 'artist' && 
              r.name.toLowerCase() === searchTerm.toLowerCase()
            )
            
            // Auto-navigate to exact match or first artist result after a brief delay
            const targetResult = exactMatch || results.find((r: SearchResult) => r.type === 'artist')
            if (targetResult) {
              setTimeout(() => {
                handleArtistClick(targetResult)
              }, 1000) // 1 second delay to show results briefly
            }
          }
          
          // For tracks, handle single result navigation
          if (searchType === 'track') {
            const trackResults = results.filter((r: SearchResult) => r.type === 'track')
            
            // Auto-navigate to a track if there's a good match
            const exactMatch = trackResults.find((r: SearchResult) => 
              r.name.toLowerCase() === searchTerm.toLowerCase()
            )
            const targetResult = exactMatch || trackResults[0]
            
            if (targetResult) {
              setTimeout(() => {
                handleTrackClick(targetResult)
              }, 1000) // 1 second delay to show results briefly
            }
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
  }, [searchTerm, searchType])

  const handleArtistClick = useCallback(async (result: SearchResult | string) => {
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
  }, [])

  const handleBackToResults = useCallback(() => {
    setShowProfile(false)
    setSelectedArtist(null)
    setSelectedTrack(null)
  }, [])

  const handleTrackClick = useCallback((track: SearchResult) => {
    setSelectedTrack(track)
    setSelectedArtist(null) // Make sure artist is cleared when viewing a track
    setShowProfile(true)
  }, [])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  const handleStreamsTab = useCallback(async () => {
    if (!selectedTrack && !selectedArtist) {
      setError("No track or artist selected.")
      return
    }
    
    try {
      setLoading(true)
      let streamsResults: Array<{
        name: string, 
        value: number, 
        platform?: string, 
        trend?: 'up' | 'down' | 'stable', 
        isPercentage?: boolean
      }> = []
      
      if (selectedTrack) {
        // Handle track streams
        const data = await api.getSpotifyStreams(selectedTrack.id)
        if (data && data.total_streams) {
          streamsResults = [
            { name: 'Total Streams', value: data.total_streams, platform: 'spotify' },
            { name: 'Monthly Streams', value: data.monthly_streams, platform: 'spotify' },
            { name: 'Daily Streams', value: data.daily_streams, platform: 'spotify' }
          ]
          
          // Add Apple Music streams if available
          if (data.apple_music_streams) {
            streamsResults.push(
              { name: 'Apple Music', value: data.apple_music_streams, platform: 'apple' }
            )
          }
          
          // Add Deezer streams if available
          if (data.deezer_streams) {
            streamsResults.push(
              { name: 'Deezer', value: data.deezer_streams, platform: 'deezer' }
            )
          }
          
          // Add trend data if available
          if (data.trend_percentage) {
            const trendDirection = data.trend_direction || 'stable'
            streamsResults.push(
              { 
                name: 'Growth Rate', 
                value: data.trend_percentage, 
                trend: trendDirection as 'up' | 'down' | 'stable',
                isPercentage: true
              }
            )
          }
        }
      } else if (selectedArtist) {
        // Try to get data from SpotonTrack first
        let data: any = null
        
        if (selectedArtist.spotontrack) {
          data = selectedArtist.spotontrack
        } else if (selectedArtist.spotify?.id) {
          // Fallback to getting artist details directly
          data = await api.getArtistDetails(selectedArtist.spotify.id)
        }
        
        if (data && data.streams) {
          streamsResults = [
            { name: 'Total Streams', value: data.streams.total, platform: 'spotify' },
            { name: 'Monthly Streams', value: data.streams.monthly, platform: 'spotify' },
            { name: 'Daily Streams', value: data.streams.daily, platform: 'spotify' }
          ]
          
          // Add other platform data if available
          if (data.streams.apple_music) {
            streamsResults.push({ name: 'Apple Music', value: data.streams.apple_music, platform: 'apple' })
          }
          
          if (data.streams.deezer) {
            streamsResults.push({ name: 'Deezer', value: data.streams.deezer, platform: 'deezer' })
          }
          
          // Add trend data if available
          if (data.marketData && data.marketData.trend) {
            streamsResults.push({ 
              name: 'Growth Trend', 
              value: data.marketData.trendPercentage || 0,
              trend: data.marketData.trend as 'up' | 'down' | 'stable',
              isPercentage: true
            })
          }
        }
      }
      
      setStreamsData(streamsResults)
    } catch (error) {
      console.error("Error fetching streams data:", error)
      setError("Failed to load streams data.")
    } finally {
      setLoading(false)
    }
  }, [selectedArtist, selectedTrack])

  const handlePlaylistsTab = useCallback(async () => {
    if (!selectedTrack && !selectedArtist) {
      setError("No track or artist selected.")
      return
    }
    
    try {
      setLoading(true)
      let playlistResults: Array<{
        name: string, 
        followers: number, 
        position: string | number,
        url?: string,
        type?: string
      }> = []
      
      if (selectedTrack) {
        // Handle track playlists
        const data = await api.getSpotifyPlaylists(selectedTrack.id)
        
        if (data) {
          // Add playlist stats
          if (data.total_playlists) {
            playlistResults.push({
              name: 'Total Playlists',
              followers: data.total_playlists,
              position: 'Stat',
              type: 'stat'
            })
          }
          
          if (data.editorial_playlists) {
            playlistResults.push({
              name: 'Editorial Playlists',
              followers: data.editorial_playlists,
              position: 'Stat',
              type: 'stat'
            })
          }
          
          if (data.user_playlists) {
            playlistResults.push({
              name: 'User Generated Playlists',
              followers: data.user_playlists,
              position: 'Stat',
              type: 'stat'
            })
          }
          
          // Add actual playlists
          if (data.spotify_playlists) {
            const spotifyPlaylists = data.spotify_playlists.map((playlist: any) => ({
              name: playlist.name,
              followers: playlist.followers,
              position: playlist.position || 'N/A',
              url: playlist.url,
              type: 'playlist'
            }))
            
            playlistResults = [...playlistResults, ...spotifyPlaylists]
          }
          
          // Add Apple Music playlists if available
          if (data.apple_music_playlists) {
            const applePlaylists = data.apple_music_playlists.map((playlist: any) => ({
              name: playlist.name,
              followers: playlist.followers || 0,
              position: playlist.position || 'N/A',
              url: playlist.url,
              type: 'apple'
            }))
            
            playlistResults = [...playlistResults, ...applePlaylists]
          }
          
          // Add Deezer playlists if available
          if (data.deezer_playlists) {
            const deezerPlaylists = data.deezer_playlists.map((playlist: any) => ({
              name: playlist.name,
              followers: playlist.followers || 0,
              position: playlist.position || 'N/A',
              url: playlist.url,
              type: 'deezer'
            }))
            
            playlistResults = [...playlistResults, ...deezerPlaylists]
          }
        }
      } else if (selectedArtist) {
        // Try to get data from SpotonTrack first
        let data: any = null
        
        if (selectedArtist.spotontrack) {
          data = selectedArtist.spotontrack
        } else if (selectedArtist.spotify?.id) {
          // Fallback to getting artist details directly
          data = await api.getArtistDetails(selectedArtist.spotify.id)
        }
        
        if (data && data.playlists) {
          // Add playlist stats
          if (data.playlists.total) {
            playlistResults.push({
              name: 'Total Playlists',
              followers: data.playlists.total,
              position: 'Stat',
              type: 'stat'
            })
          }
          
          if (data.playlists.editorial) {
            playlistResults.push({
              name: 'Editorial Playlists',
              followers: data.playlists.editorial,
              position: 'Stat',
              type: 'stat'
            })
          }
          
          if (data.playlists.userGenerated) {
            playlistResults.push({
              name: 'User Generated Playlists',
              followers: data.playlists.userGenerated,
              position: 'Stat',
              type: 'stat'
            })
          }
          
          // Add Spotify playlists
          if (data.playlists.spotifyPlaylists && data.playlists.spotifyPlaylists.length > 0) {
            const spotifyPlaylists = data.playlists.spotifyPlaylists.map((playlist: any) => ({
              name: playlist.name,
              followers: playlist.followers,
              position: playlist.position || 'N/A',
              url: playlist.url,
              type: 'playlist'
            }))
            
            playlistResults = [...playlistResults, ...spotifyPlaylists]
          }
          
          // Add Apple Music playlists
          if (data.playlists.appleMusicPlaylists) {
            const applePlaylists = data.playlists.appleMusicPlaylists.map((playlist: any) => ({
              name: playlist.name,
              followers: playlist.followers || 0,
              position: 'N/A',
              url: playlist.url,
              type: 'apple'
            }))
            
            playlistResults = [...playlistResults, ...applePlaylists]
          }
          
          // Add Deezer playlists
          if (data.playlists.deezerPlaylists) {
            const deezerPlaylists = data.playlists.deezerPlaylists.map((playlist: any) => ({
              name: playlist.name,
              followers: playlist.followers || 0,
              position: 'N/A',
              url: playlist.url,
              type: 'deezer'
            }))
            
            playlistResults = [...playlistResults, ...deezerPlaylists]
          }
        }
      }
      
      setPlaylistsData(playlistResults)
    } catch (error) {
      console.error("Error fetching playlists data:", error)
      setError("Failed to load playlists data.")
    } finally {
      setLoading(false)
    }
  }, [selectedArtist, selectedTrack])

  const handleAnalyticsTab = useCallback(async () => {
    if (!selectedTrack && !selectedArtist) {
      setError("No track or artist selected.")
      return
    }
    
    try {
      setLoading(true)
      let analyticsResults: {
        chart_positions?: Record<string, number>,
        chart_history?: Array<{date: string, position: number, chart: string}>
      } = {}
      
      if (selectedTrack) {
        // Handle track analytics
        const data = await api.getSpotifyCharts(selectedTrack.id)
        
        if (data) {
          // Add current chart positions
          if (data.chart_positions) {
            analyticsResults.chart_positions = data.chart_positions
          }
          
          // Add chart history if available
          if (data.chart_history) {
            analyticsResults.chart_history = data.chart_history.map((entry: any) => ({
              date: entry.date || entry.week || '',
              position: entry.position || 0,
              chart: entry.chart || 'Spotify Global'
            }))
          }
        }
      } else if (selectedArtist) {
        // Try to get data from SpotonTrack first
        let data: any = null
        
        if (selectedArtist.spotontrack) {
          data = selectedArtist.spotontrack
        } else if (selectedArtist.spotify?.id) {
          // Fallback to getting artist details directly
          data = await api.getArtistDetails(selectedArtist.spotify.id)
        }
        
        if (data) {
          // Format artist chart data for display
          if (data.chartPerformance) {
            analyticsResults.chart_positions = {
              'Global Rank': data.chartPerformance.currentPosition,
              'Peak Position': data.chartPerformance.peakPosition,
              'Weeks On Chart': data.chartPerformance.weeksOnChart
            }
            
            // Add country-specific charts if available
            if (data.chartPerformance.countries) {
              data.chartPerformance.countries.forEach((country: string, index: number) => {
                analyticsResults.chart_positions![`${country} Chart`] = data.chartPerformance.countryPositions?.[index] || index + 1
              })
            }
          }
          
          // Add chart history if available
          if (data.chartHistory) {
            analyticsResults.chart_history = data.chartHistory.map((entry: any) => ({
              date: entry.date || entry.week || '',
              position: entry.position || 0,
              chart: entry.chart || 'Spotify Global'
            }))
          }
        }
      }
      
      setAnalyticsData(analyticsResults)
    } catch (error) {
      console.error("Error fetching analytics data:", error)
      setError("Failed to load analytics data.")
    } finally {
      setLoading(false)
    }
  }, [selectedArtist, selectedTrack])

  const handleCollaboratorsTab = useCallback(async () => {
    if (!selectedArtist) {
      setError("No artist selected.")
      return
    }
    
    try {
      setLoading(true)
      let collaboratorsResults: Array<{name: string, role: string, collaborationCount: number, imageUrl?: string}> = []
      
      if (selectedArtist && selectedArtist.muso?.profile?.id) {
        try {
          // Import MUSO API for collaborators data
          const { musoApi } = await import('@/lib/muso-api')
          
          // Get collaborators data from MUSO API
          const collaboratorsData = await musoApi.getProfileCollaborators(
            selectedArtist.muso.profile.id,
            { limit: 10, sortKey: 'collaborationsCount', sortDirection: 'DESC' }
          )
          
          if (collaboratorsData && collaboratorsData.items) {
            collaboratorsResults = collaboratorsData.items.map((collaborator: any) => ({
              name: collaborator.name,
              role: collaborator.commonCredits?.[0] || 'Collaborator',
              collaborationCount: collaborator.collaborationsCount || 0,
              imageUrl: collaborator.avatarUrl
            }))
          }
        } catch (musoError) {
          console.error("MUSO API error:", musoError)
          // Try fallback to Spotify data
          if (selectedArtist.spotify?.id) {
            console.log("Falling back to Spotify data for collaborators")
            // Fallback to simpler collaborator data if MUSO fails
            collaboratorsResults = [
              {
                name: "MUSO API Unavailable",
                role: "Please try again later",
                collaborationCount: 0,
                imageUrl: ""
              }
            ]
          }
        }
      } else if (selectedArtist.spotify?.id) {
        console.log("No MUSO profile ID available - using Spotify data only")
        collaboratorsResults = [
          {
            name: "MUSO API Unavailable",
            role: "No MUSO data for this artist",
            collaborationCount: 0,
            imageUrl: ""
          }
        ]
      } else {
        console.log("No MUSO or Spotify data available for collaborators")
      }
      
      setCollaboratorsData(collaboratorsResults)
    } catch (error) {
      console.error("Error fetching collaborators data:", error)
      setError("Failed to load collaborators data.")
    } finally {
      setLoading(false)
    }
  }, [selectedArtist])

  const handleCreditsTab = useCallback(async () => {
    if (!selectedArtist) {
      setError("No artist selected.")
      return
    }
    
    try {
      setLoading(true)
      let creditsResults: Array<{title: string, role: string, date: string, album?: string}> = []
      
      if (selectedArtist && selectedArtist.muso?.profile?.id) {
        try {
          // Import MUSO API for credits data
          const { musoApi } = await import('@/lib/muso-api')
          
          // Get credits data from MUSO API
          const creditsData = await musoApi.getProfileCredits(
            selectedArtist.muso.profile.id,
            { limit: 10, sortKey: 'releaseDate', sortDirection: 'DESC' }
          )
          
          if (creditsData && creditsData.items) {
            creditsResults = creditsData.items.map((credit: any) => ({
              title: credit.title || credit.name,
              role: credit.role || 'Artist',
              date: credit.releaseDate || 'N/A',
              album: credit.album?.title
            }))
          }
        } catch (musoError) {
          console.error("MUSO API error:", musoError)
          // Try fallback to Spotify data
          if (selectedArtist.spotify?.id) {
            console.log("Falling back to Spotify data for credits")
            // Add a message about MUSO API being unavailable
            creditsResults = [
              {
                title: "MUSO API Unavailable",
                role: "Please try again later",
                date: new Date().toISOString().split('T')[0],
                album: "Error fetching MUSO data"
              }
            ]
          }
        }
      } else if (selectedArtist.spotify?.id) {
        console.log("No MUSO profile ID available - using Spotify data only")
        creditsResults = [
          {
            title: "MUSO API Unavailable",
            role: "No MUSO data for this artist",
            date: new Date().toISOString().split('T')[0],
            album: "No credit data available"
          }
        ]
      } else {
        console.log("No MUSO or Spotify data available for credits")
      }
      
      setCreditsData(creditsResults)
    } catch (error) {
      console.error("Error fetching credits data:", error)
      setError("Failed to load credits data.")
    } finally {
      setLoading(false)
    }
  }, [selectedArtist])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {(!apiStatus.spotify || !apiStatus.muso || !apiStatus.spotontrack) && (
          <Alert className="border-yellow-500/20 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              <strong>Limited functionality:</strong> Some music services are currently unavailable. 
              {!apiStatus.muso && (
                <span className="block mt-1">
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30 mr-2">MUSO API</Badge>
                  The MUSO API is currently unavailable. Collaborator and credit data may be limited.
                </span>
              )}
              {!apiStatus.spotontrack && (
                <span className="block mt-1">
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30 mr-2">SpotonTrack API</Badge>
                  The SpotonTrack API is currently unavailable. Analytics and streaming data may be limited.
                </span>
              )}
              {!apiStatus.spotify && (
                <span className="block mt-1">
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30 mr-2">Spotify API</Badge>
                  The Spotify API is currently unavailable. Some artist and track data may be limited.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

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

            <div className="flex gap-1 mt-4">
              {(['artist', 'track'] as const).map((type) => (
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
                            {result.hasSpotonTrackData && (
                              <Badge variant="outline" className="border-green-500 text-green-300 text-xs px-1.5 py-0">
                                <TrendingUp className="w-2 h-2 mr-1" />
                                Live Data
                              </Badge>
                            )}
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
                      <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1 sm:gap-2 mb-4 p-1 bg-gray-800">
                        <TabsTrigger value="overview" className="text-white text-xs sm:text-sm px-2 py-1">
                          Overview
                        </TabsTrigger>
                        <TabsTrigger value="tracks" className="text-white text-xs sm:text-sm px-2 py-1">
                          Tracks
                        </TabsTrigger>
                        <TabsTrigger value="streams" onClick={handleStreamsTab} className="text-white text-xs sm:text-sm px-2 py-1">
                          Streams
                        </TabsTrigger>
                        <TabsTrigger value="playlists" onClick={handlePlaylistsTab} className="text-white text-xs sm:text-sm px-2 py-1">
                          Playlists
                        </TabsTrigger>
                        <TabsTrigger value="collaborators" onClick={handleCollaboratorsTab} className="text-white text-xs sm:text-sm px-2 py-1">
                          Collaborators
                        </TabsTrigger>
                        <TabsTrigger value="credits" onClick={handleCreditsTab} className="text-white text-xs sm:text-sm px-2 py-1">
                          Credits
                        </TabsTrigger>
                        <TabsTrigger value="analytics" onClick={handleAnalyticsTab} className="text-white text-xs sm:text-sm px-2 py-1">
                          Analytics
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="md:w-1/4">
                            <Avatar className="w-full h-auto aspect-square rounded-lg max-w-[180px]">
                              <AvatarImage src={selectedArtist.combined.imageUrl} alt={selectedArtist.combined.name} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {selectedArtist.combined.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="md:w-3/4">
                            <h2 className="text-xl font-bold text-white">{selectedArtist.combined.name}</h2>
                            {selectedArtist.combined.genres?.length > 0 && (
                              <div className="flex flex-wrap gap-2 my-2">
                                {selectedArtist.combined.genres.map((genre, index) => (
                                  <Badge key={index} className="bg-gray-700 text-blue-300">
                                    {genre}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-2 mt-4">
                              <div className="bg-gray-800/50 p-3 rounded-lg">
                                <p className="text-gray-400 text-xs">Popularity</p>
                                <p className="text-xl font-bold text-white">{selectedArtist.combined.popularityScore || 'N/A'}</p>
                              </div>
                              <div className="bg-gray-800/50 p-3 rounded-lg">
                                <p className="text-gray-400 text-xs">Followers</p>
                                <p className="text-xl font-bold text-white">
                                  {selectedArtist.combined.followers?.total 
                                    ? formatNumber(selectedArtist.combined.followers.total) 
                                    : 'N/A'}
                                </p>
                              </div>
                            </div>
                            {selectedArtist.combined.socialLinks && (
                              <div className="flex gap-2 mt-4">
                                {selectedArtist.combined.socialLinks.spotify && (
                                  <Button variant="outline" size="sm" className="text-xs" asChild>
                                    <a href={selectedArtist.combined.socialLinks.spotify} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      Spotify
                                    </a>
                                  </Button>
                                )}
                                {selectedArtist.combined.socialLinks.website && (
                                  <Button variant="outline" size="sm" className="text-xs" asChild>
                                    <a href={selectedArtist.combined.socialLinks.website} target="_blank" rel="noopener noreferrer">
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
                      
                      <TabsContent value="tracks">
                        <ArtistTracks 
                          artistName={selectedArtist.combined.name} 
                          onTrackClick={handleTrackClick}
                        />
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
                                  Streaming Data
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {streamsData.map((stream, index) => (
                                    <div 
                                      key={index} 
                                      className={`bg-gray-800/30 p-4 rounded-lg text-center ${
                                        stream.platform === 'apple' ? 'border-l-2 border-red-500/50' : 
                                        stream.platform === 'deezer' ? 'border-l-2 border-purple-500/50' : 
                                        stream.trend === 'up' ? 'border-l-2 border-green-500/50' :
                                        stream.trend === 'down' ? 'border-l-2 border-red-500/50' :
                                        'border-l-2 border-blue-500/50'
                                      }`}
                                    >
                                      <div className="flex items-center justify-center mb-2">
                                        <p className="text-gray-400 text-sm">{stream.name}</p>
                                        {stream.platform === 'spotify' && !stream.trend && (
                                          <svg className="w-4 h-4 ml-1 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                                          </svg>
                                        )}
                                        {stream.platform === 'apple' && (
                                          <svg className="w-4 h-4 ml-1 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
                                          </svg>
                                        )}
                                        {stream.platform === 'deezer' && (
                                          <svg className="w-4 h-4 ml-1 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M15.68 0h4.662v4.457H15.68V0zm0 4.957h4.662v4.443H15.68V4.957zm0 9.143v-4.444h4.662v4.444H15.68zm-5.325-9.143h4.664v4.443h-4.664V4.957zm0 9.143v-4.444h4.664v4.444h-4.664zm-5.325-9.143h4.664v4.443H5.03V4.957zm0 9.143v-4.444h4.664v4.444H5.03zM0 14.1v-4.444h4.661V14.1H0zm0-4.7V4.957h4.661v4.443H0z"/>
                                          </svg>
                                        )}
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
                                        stream.platform === 'apple' ? 'text-red-400' : 
                                        stream.platform === 'deezer' ? 'text-purple-400' : 
                                        stream.trend === 'up' ? 'text-green-400' :
                                        stream.trend === 'down' ? 'text-red-400' :
                                        'text-green-400'
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
                            <p className="text-gray-400">No streaming data available.</p>
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
                                  Playlists Data ({playlistsData.length || 0})
                                </h4>
                                
                                {/* Stats section */}
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
                                
                                {/* Playlists section */}
                                <div className="space-y-3">
                                  {playlistsData
                                    .filter(p => p.type !== 'stat')
                                    .slice(0, 10)
                                    .map((playlist, index) => (
                                      <div 
                                        key={`playlist-${index}`} 
                                        className={`bg-gray-800/30 p-3 rounded-lg flex items-center justify-between ${
                                          playlist.type === 'apple' ? 'border-l-2 border-red-500/50' : 
                                          playlist.type === 'deezer' ? 'border-l-2 border-purple-500/50' : 
                                          'border-l-2 border-blue-500/50'
                                        }`}
                                      >
                                        <div>
                                          <div className="flex items-center">
                                            <p className="text-white font-medium">{playlist.name}</p>
                                            {playlist.type === 'apple' && (
                                              <svg className="w-4 h-4 ml-1 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
                                              </svg>
                                            )}
                                            {playlist.type === 'deezer' && (
                                              <svg className="w-4 h-4 ml-1 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M15.68 0h4.662v4.457H15.68V0zm0 4.957h4.662v4.443H15.68V4.957zm0 9.143v-4.444h4.662v4.444H15.68zm-5.325-9.143h4.664v4.443h-4.664V4.957zm0 9.143v-4.444h4.664v4.444h-4.664zm-5.325-9.143h4.664v4.443H5.03V4.957zm0 9.143v-4.444h4.664v4.444H5.03zM0 14.1v-4.444h4.661V14.1H0zm0-4.7V4.957h4.661v4.443H0z"/>
                                              </svg>
                                            )}
                                            {playlist.type !== 'apple' && playlist.type !== 'deezer' && (
                                              <svg className="w-4 h-4 ml-1 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                                              </svg>
                                            )}
                                          </div>
                                          <p className="text-gray-400 text-sm">
                                            Position: {playlist.position || 'N/A'}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className={`font-medium ${
                                            playlist.type === 'apple' ? 'text-red-400' : 
                                            playlist.type === 'deezer' ? 'text-purple-400' : 
                                            'text-blue-400'
                                          }`}>
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
                                  
                                  {playlistsData.filter(p => p.type !== 'stat').length > 10 && (
                                    <div className="text-center pt-2">
                                      <p className="text-gray-400 text-sm">
                                        + {playlistsData.filter(p => p.type !== 'stat').length - 10} more playlists
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-400">No playlist data available.</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="analytics" className="space-y-6">
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <CustomLoader size="md" />
                            <span className="ml-2 text-gray-400 text-sm">Loading analytics data...</span>
                          </div>
                        ) : analyticsData && (analyticsData.chart_positions || analyticsData.chart_history) ? (
                          <div className="space-y-4">
                            {/* Chart Positions */}
                            {analyticsData.chart_positions && Object.keys(analyticsData.chart_positions).length > 0 && (
                              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/5 border-purple-500/20">
                                <CardContent className="p-6">
                                  <h4 className="text-white font-medium mb-4 flex items-center">
                                    <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                                    Chart Positions
                                  </h4>
                                  <div className="space-y-3">
                                    {Object.entries(analyticsData.chart_positions).map(([chart, position], index) => (
                                      <div key={index} className="bg-gray-800/30 p-3 rounded-lg flex items-center justify-between">
                                        <p className="text-white font-medium">
                                          {chart.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </p>
                                        <div className="flex items-center">
                                          <Badge className={`
                                            ${parseInt(String(position)) <= 10 ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                                              parseInt(String(position)) <= 50 ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 
                                              'bg-blue-500/20 text-blue-300 border-blue-500/30'}
                                          `}>
                                            #{String(position)}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            
                            {/* Chart History */}
                            {analyticsData.chart_history && analyticsData.chart_history.length > 0 && (
                              <Card className="bg-gradient-to-br from-indigo-500/10 to-blue-600/5 border-indigo-500/20">
                                <CardContent className="p-6">
                                  <h4 className="text-white font-medium mb-4 flex items-center">
                                    <TrendingUp className="w-5 h-5 mr-2 text-indigo-400" />
                                    Chart History
                                  </h4>
                                  <div className="space-y-3">
                                    {analyticsData.chart_history.slice(0, 10).map((entry, index) => (
                                      <div key={index} className="bg-gray-800/30 p-3 rounded-lg flex items-center justify-between">
                                        <div>
                                          <p className="text-white font-medium">{entry.chart || 'Global Chart'}</p>
                                          <p className="text-gray-400 text-sm">
                                            {new Date(entry.date).toLocaleDateString(undefined, {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </p>
                                        </div>
                                        <div className="flex items-center">
                                          <Badge className={`
                                            ${entry.position <= 10 ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                                              entry.position <= 50 ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 
                                              'bg-blue-500/20 text-blue-300 border-blue-500/30'}
                                          `}>
                                            #{entry.position}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                    
                                    {analyticsData.chart_history.length > 10 && (
                                      <div className="text-center pt-2">
                                        <p className="text-gray-400 text-sm">
                                          + {analyticsData.chart_history.length - 10} more chart entries
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-400">No analytics data available.</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="collaborators" className="space-y-6">
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <CustomLoader size="md" />
                            <span className="ml-2 text-gray-400 text-sm">Loading collaborators data...</span>
                          </div>
                        ) : collaboratorsData && collaboratorsData.length > 0 ? (
                          <div className="space-y-4">
                            <Card className="bg-gradient-to-br from-indigo-500/10 to-blue-600/5 border-indigo-500/20">
                              <CardContent className="p-6">
                                <h4 className="text-white font-medium mb-4 flex items-center">
                                  <Users className="w-5 h-5 mr-2 text-indigo-400" />
                                  Collaborators ({collaboratorsData.length})
                                  {collaboratorsData[0]?.name === "MUSO API Unavailable" && (
                                    <Badge className="ml-2 bg-red-500/20 text-red-300 border-red-500/30">
                                      MUSO API Unavailable
                                    </Badge>
                                  )}
                                </h4>
                                <div className="space-y-3">
                                  {collaboratorsData[0]?.name === "MUSO API Unavailable" ? (
                                    <div className="bg-gray-800/30 p-4 rounded-lg text-center">
                                      <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
                                      <p className="text-white font-medium">MUSO API data currently unavailable</p>
                                      <p className="text-gray-400 text-sm mt-1">
                                        We're having trouble connecting to the MUSO API. Please try again later or contact support if the issue persists.
                                      </p>
                                    </div>
                                  ) : (
                                    collaboratorsData.map((collaborator, index) => (
                                      <div key={index} className="bg-gray-800/30 p-3 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <Avatar className="w-10 h-10 ring-1 ring-gray-600">
                                            <AvatarImage src={collaborator.imageUrl} alt={collaborator.name} />
                                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
                                              {collaborator.name.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <p className="text-white font-medium">{collaborator.name}</p>
                                            <p className="text-gray-400 text-xs">{collaborator.role}</p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                                            {collaborator.collaborationCount} collaborations
                                          </Badge>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-400">No collaborators data available from MUSO.</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="credits" className="space-y-6">
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <CustomLoader size="md" />
                            <span className="ml-2 text-gray-400 text-sm">Loading credits data...</span>
                          </div>
                        ) : creditsData && creditsData.length > 0 ? (
                          <div className="space-y-4">
                            <Card className="bg-gradient-to-br from-amber-500/10 to-orange-600/5 border-amber-500/20">
                              <CardContent className="p-6">
                                <h4 className="text-white font-medium mb-4 flex items-center">
                                  <Music className="w-5 h-5 mr-2 text-amber-400" />
                                  Credits ({creditsData.length})
                                  {creditsData[0]?.title === "MUSO API Unavailable" && (
                                    <Badge className="ml-2 bg-red-500/20 text-red-300 border-red-500/30">
                                      MUSO API Unavailable
                                    </Badge>
                                  )}
                                </h4>
                                <div className="space-y-3">
                                  {creditsData[0]?.title === "MUSO API Unavailable" ? (
                                    <div className="bg-gray-800/30 p-4 rounded-lg text-center">
                                      <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
                                      <p className="text-white font-medium">MUSO API data currently unavailable</p>
                                      <p className="text-gray-400 text-sm mt-1">
                                        We're having trouble connecting to the MUSO API. Please try again later or contact support if the issue persists.
                                      </p>
                                    </div>
                                  ) : (
                                    creditsData.map((credit, index) => (
                                      <div key={index} className="bg-gray-800/30 p-3 rounded-lg">
                                        <div className="flex justify-between">
                                          <div>
                                            <p className="text-white font-medium">{credit.title}</p>
                                            {credit.album && (
                                              <p className="text-gray-400 text-xs">Album: {credit.album}</p>
                                            )}
                                          </div>
                                          <div className="text-right">
                                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                                              {credit.role}
                                            </Badge>
                                            <p className="text-gray-400 text-xs mt-1">{credit.date}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-400">No credits data available from MUSO.</p>
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
        
        {showProfile && selectedTrack && (
          <TrackDetails
            trackId={selectedTrack.id}
            trackName={selectedTrack.name}
            artistName={selectedTrack.artist || ''}
            albumName={selectedTrack.album}
            imageUrl={selectedTrack.imageUrl}
            onBack={handleBackToResults}
            onArtistClick={(artistName) => {
              handleArtistClick(artistName)
            }}
          />
        )}

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

export const CombinedMusicSearch = memo(CombinedMusicSearchComponent)
