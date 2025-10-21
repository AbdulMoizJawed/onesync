"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, Music, Play, ExternalLink, Radio, 
  BarChart3, TrendingUp, Award, Star, Mic, Activity,
  AlertCircle, AlertTriangle, Clock, Flag, MapPin
} from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"
import { OptimizedImage } from "@/components/optimized-image"

interface TrackDetailsProps {
  trackId: string
  trackName: string
  artistName: string
  albumName?: string
  imageUrl?: string
  onBack: () => void
  onArtistClick?: (artistName: string) => void
}

export function TrackDetails({ 
  trackId, 
  trackName, 
  artistName, 
  albumName, 
  imageUrl, 
  onBack,
  onArtistClick
}: TrackDetailsProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trackDetails, setTrackDetails] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<string>('overview')

  useEffect(() => {
    const fetchTrackDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Add trackId to the query to ensure we get the right track data
        const response = await fetch(`/api/track/enriched?trackId=${encodeURIComponent(trackId)}&title=${encodeURIComponent(trackName)}&artist=${encodeURIComponent(artistName)}`)
        
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setTrackDetails(data.data)
          } else {
            setError(data.message || 'Failed to load track details')
          }
        } else {
          setError('Failed to load track details. Please try again.')
        }
      } catch (error) {
        console.error('Error loading track details:', error)
        setError('An unexpected error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchTrackDetails()
  }, [trackId, trackName, artistName])

  useEffect(() => {
    const handler = (e: Event) => {
      const val = (e as CustomEvent<string>).detail
      setActiveTab(val)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('track-details:tab-change', handler as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('track-details:tab-change', handler as EventListener)
      }
    }
  }, [])

  useEffect(() => {
    // Re-run the fetch when activeTab changes to simulate pulling fresh data per tab
    // Note: endpoint remains the same, server merges data; tab changes trigger refetch
    const refresh = async () => {
      try {
        const res = await fetch(`/api/track/enriched?trackId=${encodeURIComponent(trackId)}&title=${encodeURIComponent(trackName)}&artist=${encodeURIComponent(artistName)}&tab=${encodeURIComponent(activeTab)}`, { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          if (json.success) setTrackDetails(json.data)
        }
      } catch {}
    }
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  
  // Chart history visualization
  const ChartHistoryPlaceholder = () => {
    // Check if we have chart history data
    if (trackDetails?.spotontrack?.chartHistory && trackDetails.spotontrack.chartHistory.length > 0) {
      const chartHistory = trackDetails.spotontrack.chartHistory;
      
      // Sort the chart history by date
      const sortedHistory = [...chartHistory].sort((a, b) => 
        new Date(a.week).getTime() - new Date(b.week).getTime()
      );
      
      // Calculate the maximum position (for scaling)
      const maxPosition = Math.max(...sortedHistory.map(entry => entry.position)) + 3;
      
      return (
        <div className="w-full h-64">
          <div className="w-full h-full flex flex-col relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between px-2 py-4">
              <span className="text-xs text-gray-400">#1</span>
              <span className="text-xs text-gray-400">#{Math.round(maxPosition / 2)}</span>
              <span className="text-xs text-gray-400">#{maxPosition}</span>
            </div>
            
            {/* Chart area */}
            <div className="ml-8 h-full flex items-end">
              {sortedHistory.map((entry, index) => {
                // Calculate height percentage (invert the position since #1 is highest)
                const heightPercent = 100 - ((entry.position / maxPosition) * 100);
                return (
                  <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div 
                      className="bg-blue-500 hover:bg-blue-400 rounded-t-sm w-4/5 group relative"
                      style={{ height: `${heightPercent}%` }}
                    >
                      {/* Tooltip */}
                      <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap transition-opacity">
                        Week of {entry.week}: #{entry.position}
                      </div>
                    </div>
                    {index % 2 === 0 && (
                      <span className="text-xs text-gray-500 mt-1 rotate-45 origin-top-left truncate w-8 text-center">
                        {new Date(entry.week).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    
    // Fallback when no chart history is available
    return (
      <div className="w-full h-full flex items-center justify-center flex-col">
        <Activity className="w-16 h-16 text-gray-700 mb-4" />
        <p className="text-gray-500 text-center">
          Chart history visualization will appear here when available
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CustomLoader size="lg" />
        <span className="ml-3 text-gray-400">Loading track details...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-gray-800/90 border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <CardTitle className="text-white">Track Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Music className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">Error Loading Track Details</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700">
            Return to Results
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!trackDetails) {
    return (
      <Card className="bg-gray-800/90 border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <CardTitle className="text-white">Track Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Music className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No Track Details Found</h3>
          <p className="text-gray-400 mb-6">We couldn't find detailed information for this track.</p>
          <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700">
            Return to Results
          </Button>
        </CardContent>
      </Card>
    )
  }

  const spotify = trackDetails?.spotify || {}
  const spotontrack = trackDetails?.spotontrack || {}
  const combined = trackDetails?.combined || {
    title: trackName,
    artists: [artistName],
    imageUrl: imageUrl,
    album: albumName
  }

  return (
    <Card className="bg-gray-800/90 border-gray-700">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex-1">
            <div className="flex items-center text-sm text-gray-400 mb-2">
              <span className="hover:text-gray-300 cursor-pointer" onClick={onBack}>
                Search Results
              </span>
              <span className="mx-2">•</span>
              <span className="text-gray-300">Track Details</span>
            </div>
            <CardTitle className="text-white flex items-center gap-2">
              <Music className="w-5 h-5" />
              {combined.name}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full" onValueChange={(val) => {
          // Re-fetch on tab change to ensure fresh API data per tab
          // This keeps UI in sync with the latest search query
          if (typeof window !== 'undefined') {
            const evt = new CustomEvent('track-details:tab-change', { detail: val })
            window.dispatchEvent(evt)
          }
        }}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-0 w-full bg-gray-800">
            <TabsTrigger value="overview" className="text-white text-xs sm:text-sm px-2 py-2">
              <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="streams" className="text-white text-xs sm:text-sm px-2 py-2">
              <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Streams
            </TabsTrigger>
            <TabsTrigger value="playlists" className="text-white text-xs sm:text-sm px-2 py-2">
              <Radio className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Playlists
            </TabsTrigger>
            <TabsTrigger value="charts" className="text-white text-xs sm:text-sm px-2 py-2">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Charts
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Track Header */}
            <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-lg border border-gray-700/50">
              <div className="w-32 h-32 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {combined.imageUrl ? (
                  <OptimizedImage
                    src={combined.imageUrl}
                    alt={combined.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="w-16 h-16 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {combined.title}
                </h1>
                <p className="text-xl text-gray-300 mb-4">
                  by <span 
                      className="hover:text-blue-400 cursor-pointer transition-colors" 
                      onClick={() => onArtistClick ? onArtistClick(combined.artists?.[0] || artistName) : null}
                    >
                      {combined.artists?.[0] || artistName}
                    </span>
                </p>
                {combined.album && (
                  <p className="text-gray-400 mb-4">
                    Album: {combined.album}
                  </p>
                )}
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {spotify.popularity !== undefined && (
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-white">{spotify.popularity}</div>
                      <div className="text-gray-400 text-xs">Spotify Popularity</div>
                    </div>
                  )}
                  
                  {spotify.duration_ms && (
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <Award className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-white">{formatDuration(spotify.duration_ms)}</div>
                      <div className="text-gray-400 text-xs">Duration</div>
                    </div>
                  )}
                  
                  {spotontrack?.streams?.total && (
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <Play className="w-5 h-5 text-green-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-white">{formatNumber(spotontrack.streams.total)}</div>
                      <div className="text-gray-400 text-xs">Total Streams</div>
                    </div>
                  )}
                  
                  {spotontrack?.playlists?.total && (
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <Radio className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-white">{formatNumber(spotontrack.playlists.total)}</div>
                      <div className="text-gray-400 text-xs">Playlists</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {spotify.external_urls?.spotify && (
                <a
                  href={spotify.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Play className="w-5 h-5" />
                  <span className="font-medium">Listen on Spotify</span>
                </a>
              )}
              <button 
                className="flex items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                onClick={() => onArtistClick ? onArtistClick(combined.artist) : null}
              >
                <Mic className="w-5 h-5" />
                <span className="font-medium">View Artist</span>
              </button>
              <button className="flex items-center justify-center gap-2 p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                <ExternalLink className="w-5 h-5" />
                <span className="font-medium">Share Track</span>
              </button>
            </div>

            {/* Audio Features */}
            {(combined.audioFeatures || spotontrack?.audioFeatures) && (
              <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-gray-600/30">
                <CardHeader>
                  <CardTitle className="text-white">Audio Features</CardTitle>
                  <p className="text-gray-400 text-sm">
                    {combined.audioFeatures ? 'Real Spotify audio analysis' : 'SpotonTrack industry analysis'}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-400">Danceability</span>
                      <span className="text-sm text-white font-medium">
                        {Math.round((combined.audioFeatures?.danceability || spotontrack.audioFeatures?.danceability || 0) * 100)}%
                      </span>
                    </div>
                    <Progress value={(combined.audioFeatures?.danceability || spotontrack.audioFeatures?.danceability || 0) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-400">Energy</span>
                      <span className="text-sm text-white font-medium">
                        {Math.round((combined.audioFeatures?.energy || spotontrack.audioFeatures?.energy || 0) * 100)}%
                      </span>
                    </div>
                    <Progress value={(combined.audioFeatures?.energy || spotontrack.audioFeatures?.energy || 0) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-400">Valence (Positivity)</span>
                      <span className="text-sm text-white font-medium">
                        {Math.round((combined.audioFeatures?.valence || spotontrack.audioFeatures?.valence || 0) * 100)}%
                      </span>
                    </div>
                    <Progress value={(combined.audioFeatures?.valence || spotontrack.audioFeatures?.valence || 0) * 100} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-gray-800/50 p-3 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Tempo</div>
                      <div className="text-lg font-medium text-white">
                        {Math.round(combined.audioFeatures?.tempo || spotontrack.audioFeatures?.tempo || 0)} BPM
                      </div>
                    </div>
                    {spotify.popularity && (
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Spotify Score</div>
                        <div className="text-lg font-medium text-white">{spotify.popularity}/100</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Streams Tab */}
          <TabsContent value="streams" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 border-green-500/20">
                <CardContent className="p-6 text-center">
                  <Star className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">
                    {spotify.popularity || 'N/A'}
                  </div>
                  <p className="text-green-400 font-medium">Spotify Popularity</p>
                  <p className="text-gray-500 text-xs mt-1">Real-time data</p>
                </CardContent>
              </Card>
              
              {spotontrack?.streams?.total && (
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-600/5 border-blue-500/20">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-white mb-2">
                      {formatNumber(spotontrack.streams.total)}
                    </div>
                    <p className="text-blue-400 font-medium">Total Streams</p>
                    <p className="text-gray-500 text-xs mt-1">SpotonTrack data</p>
                  </CardContent>
                </Card>
              )}
              
              {spotontrack?.streams?.monthly && (
                <Card className="bg-gradient-to-br from-indigo-500/10 to-violet-600/5 border-indigo-500/20">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-white mb-2">
                      {formatNumber(spotontrack.streams.monthly)}
                    </div>
                    <p className="text-indigo-400 font-medium">Monthly Streams</p>
                    <p className="text-gray-500 text-xs mt-1">SpotonTrack data</p>
                  </CardContent>
                </Card>
              )}
              
              {spotontrack?.streams?.daily && (
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/5 border-purple-500/20">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-white mb-2">
                      {formatNumber(spotontrack.streams.daily)}
                    </div>
                    <p className="text-purple-400 font-medium">Daily Streams</p>
                    <p className="text-gray-500 text-xs mt-1">SpotonTrack data</p>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Streaming History Visualization */}
            {spotontrack?.streaming_history && spotontrack.streaming_history.length > 0 && (
              <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-gray-600/30">
                <CardHeader>
                  <CardTitle className="text-white">Streaming History</CardTitle>
                  <p className="text-gray-400 text-sm">
                    Daily streaming data for the last 30 days (SpotonTrack)
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="w-full h-64">
                    <div className="w-full h-full flex flex-col relative">
                      {/* Y-axis labels */}
                      <div className="absolute left-0 top-0 h-full flex flex-col justify-between px-2 py-4">
                        <span className="text-xs text-gray-400">Max</span>
                        <span className="text-xs text-gray-400">Mid</span>
                        <span className="text-xs text-gray-400">Min</span>
                      </div>
                      
                      {/* Chart area */}
                      <div className="ml-8 h-full flex items-end">
                        {spotontrack.streaming_history.map((entry: any, index: number) => {
                          // Find max streams value for scaling
                          const maxStreams = Math.max(...spotontrack.streaming_history.map((d: any) => d.streams));
                          const heightPercent = (entry.streams / maxStreams) * 100;
                          
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                              <div 
                                className="bg-green-500 hover:bg-green-400 rounded-t-sm w-4/5 group relative"
                                style={{ height: `${heightPercent}%` }}
                              >
                                {/* Tooltip */}
                                <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap transition-opacity">
                                  {entry.date}: {formatNumber(entry.streams)} streams
                                </div>
                              </div>
                              {index % 5 === 0 && (
                                <span className="text-xs text-gray-500 mt-1 rotate-45 origin-top-left truncate w-8 text-center">
                                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Audio Features Details */}
            {(combined.audioFeatures || spotontrack?.audioFeatures) && (
              <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-gray-600/30">
                <CardHeader>
                  <CardTitle className="text-white">Detailed Audio Features</CardTitle>
                  <p className="text-gray-400 text-sm">
                    {combined.audioFeatures ? 'Real audio analysis from Spotify' : 'Industry analysis from SpotonTrack'}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Audio Features Progress Bars */}
                  {(combined.audioFeatures || spotontrack?.audioFeatures) && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-400">Danceability</span>
                          <span className="text-sm text-white font-medium">
                            {Math.round((combined.audioFeatures?.danceability || spotontrack.audioFeatures?.danceability || 0) * 100)}%
                          </span>
                        </div>
                        <Progress value={(combined.audioFeatures?.danceability || spotontrack.audioFeatures?.danceability || 0) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-400">Energy</span>
                          <span className="text-sm text-white font-medium">
                            {Math.round((combined.audioFeatures?.energy || spotontrack.audioFeatures?.energy || 0) * 100)}%
                          </span>
                        </div>
                        <Progress value={(combined.audioFeatures?.energy || spotontrack.audioFeatures?.energy || 0) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-400">Valence (Positivity)</span>
                          <span className="text-sm text-white font-medium">
                            {Math.round((combined.audioFeatures?.valence || spotontrack.audioFeatures?.valence || 0) * 100)}%
                          </span>
                        </div>
                        <Progress value={(combined.audioFeatures?.valence || spotontrack.audioFeatures?.valence || 0) * 100} className="h-2" />
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                      <div className="text-sm text-gray-400 mb-1">Tempo</div>
                      <div className="text-lg font-medium text-white">
                        {Math.round(combined.audioFeatures?.tempo || spotontrack.audioFeatures?.tempo || 0)} BPM
                      </div>
                    </div>
                    {spotify.popularity && (
                      <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-400 mb-1">Spotify Score</div>
                        <div className="text-lg font-medium text-white">{spotify.popularity}/100</div>
                      </div>
                    )}
                    {spotontrack?.marketData?.commercial_appeal && (
                      <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-400 mb-1">Commercial Appeal</div>
                        <div className="text-lg font-medium text-white">{spotontrack.marketData.commercial_appeal}/100</div>
                      </div>
                    )}
                    {spotontrack?.marketData?.virality_score && (
                      <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-400 mb-1">Virality Score</div>
                        <div className="text-lg font-medium text-white">{spotontrack.marketData.virality_score}/100</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Streams Tab */}
          <TabsContent value="streams" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 border-green-500/20">
                <CardContent className="p-6 text-center">
                  <Star className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">
                    {spotify.popularity || 'N/A'}
                  </div>
                  <p className="text-green-400 font-medium">Spotify Popularity</p>
                  <p className="text-gray-500 text-xs mt-1">Real-time data</p>
                </CardContent>
              </Card>
              
              {spotontrack?.streams?.total && (
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-600/5 border-blue-500/20">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-white mb-2">
                      {formatNumber(spotontrack.streams.total)}
                    </div>
                    <p className="text-blue-400 font-medium">Total Streams</p>
                    <p className="text-gray-500 text-xs mt-1">SpotonTrack data</p>
                  </CardContent>
                </Card>
              )}
              
              {spotontrack?.streams?.monthly && (
                <Card className="bg-gradient-to-br from-indigo-500/10 to-violet-600/5 border-indigo-500/20">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-white mb-2">
                      {formatNumber(spotontrack.streams.monthly)}
                    </div>
                    <p className="text-indigo-400 font-medium">Monthly Streams</p>
                    <p className="text-gray-500 text-xs mt-1">SpotonTrack data</p>
                  </CardContent>
                </Card>
              )}
              
              {spotontrack?.streams?.daily && (
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/5 border-purple-500/20">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-white mb-2">
                      {formatNumber(spotontrack.streams.daily)}
                    </div>
                    <p className="text-purple-400 font-medium">Daily Streams</p>
                    <p className="text-gray-500 text-xs mt-1">SpotonTrack data</p>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Streaming History Visualization */}
            {spotontrack?.streaming_history && spotontrack.streaming_history.length > 0 && (
              <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-gray-600/30">
                <CardHeader>
                  <CardTitle className="text-white">Streaming History</CardTitle>
                  <p className="text-gray-400 text-sm">
                    Daily streaming data for the last 30 days (SpotonTrack)
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="w-full h-64">
                    <div className="w-full h-full flex flex-col relative">
                      {/* Y-axis labels */}
                      <div className="absolute left-0 top-0 h-full flex flex-col justify-between px-2 py-4">
                        <span className="text-xs text-gray-400">Max</span>
                        <span className="text-xs text-gray-400">Mid</span>
                        <span className="text-xs text-gray-400">Min</span>
                      </div>
                      
                      {/* Chart area */}
                      <div className="ml-8 h-full flex items-end">
                        {spotontrack.streaming_history.map((entry: any, index: number) => {
                          // Find max streams value for scaling
                          const maxStreams = Math.max(...spotontrack.streaming_history.map((d: any) => d.streams));
                          const heightPercent = (entry.streams / maxStreams) * 100;
                          
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                              <div 
                                className="bg-green-500 hover:bg-green-400 rounded-t-sm w-4/5 group relative"
                                style={{ height: `${heightPercent}%` }}
                              >
                                {/* Tooltip */}
                                <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap transition-opacity">
                                  {entry.date}: {formatNumber(entry.streams)} streams
                                </div>
                              </div>
                              {index % 5 === 0 && (
                                <span className="text-xs text-gray-500 mt-1 rotate-45 origin-top-left truncate w-8 text-center">
                                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Audio Features Details */}
            {(combined.audioFeatures || spotontrack?.audioFeatures) && (
              <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-gray-600/30">
                <CardHeader>
                  <CardTitle className="text-white">Detailed Audio Features</CardTitle>
                  <p className="text-gray-400 text-sm">
                    {combined.audioFeatures ? 'Real audio analysis from Spotify' : 'Industry analysis from SpotonTrack'}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Audio Features Progress Bars */}
                  {(combined.audioFeatures || spotontrack?.audioFeatures) && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-400">Danceability</span>
                          <span className="text-sm text-white font-medium">
                            {Math.round((combined.audioFeatures?.danceability || spotontrack.audioFeatures?.danceability || 0) * 100)}%
                          </span>
                        </div>
                        <Progress value={(combined.audioFeatures?.danceability || spotontrack.audioFeatures?.danceability || 0) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-400">Energy</span>
                          <span className="text-sm text-white font-medium">
                            {Math.round((combined.audioFeatures?.energy || spotontrack.audioFeatures?.energy || 0) * 100)}%
                          </span>
                        </div>
                        <Progress value={(combined.audioFeatures?.energy || spotontrack.audioFeatures?.energy || 0) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-400">Valence (Positivity)</span>
                          <span className="text-sm text-white font-medium">
                            {Math.round((combined.audioFeatures?.valence || spotontrack.audioFeatures?.valence || 0) * 100)}%
                          </span>
                        </div>
                        <Progress value={(combined.audioFeatures?.valence || spotontrack.audioFeatures?.valence || 0) * 100} className="h-2" />
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                      <div className="text-sm text-gray-400 mb-1">Tempo</div>
                      <div className="text-lg font-medium text-white">
                        {Math.round(combined.audioFeatures?.tempo || spotontrack.audioFeatures?.tempo || 0)} BPM
                      </div>
                    </div>
                    {spotify.popularity && (
                      <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-400 mb-1">Spotify Score</div>
                        <div className="text-lg font-medium text-white">{spotify.popularity}/100</div>
                      </div>
                    )}
                    {spotontrack?.marketData?.commercial_appeal && (
                      <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-400 mb-1">Commercial Appeal</div>
                        <div className="text-lg font-medium text-white">{spotontrack.marketData.commercial_appeal}/100</div>
                      </div>
                    )}
                    {spotontrack?.marketData?.virality_score && (
                      <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-400 mb-1">Virality Score</div>
                        <div className="text-lg font-medium text-white">{spotontrack.marketData.virality_score}/100</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Playlists Tab */}
          <TabsContent value="playlists" className="space-y-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {spotontrack?.playlists?.total && (
                  <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 border-green-500/20">
                    <CardContent className="p-6 text-center">
                      <Radio className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <div className="text-3xl font-bold text-white mb-2">
                        {formatNumber(spotontrack.playlists.total)}
                      </div>
                      <p className="text-green-400 font-medium">Total Playlists</p>
                      <p className="text-gray-500 text-xs mt-1">SpotonTrack data</p>
                    </CardContent>
                  </Card>
                )}
                
                <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-600/5 border-blue-500/20">
                  <CardContent className="p-6 text-center">
                    <Star className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-white mb-2">
                      {spotify.popularity || 'N/A'}
                    </div>
                    <p className="text-blue-400 font-medium">Spotify Popularity</p>
                    <p className="text-gray-500 text-xs mt-1">Real-time data</p>
                  </CardContent>
                </Card>
                
                {spotontrack?.playlists?.additions_last_week ? (
                  <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-600/5 border-orange-500/20">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                      <div className="text-3xl font-bold text-white mb-2">
                        {spotontrack.playlists.additions_last_week}
                      </div>
                      <p className="text-orange-400 font-medium">Weekly Adds</p>
                      <p className="text-gray-500 text-xs mt-1">SpotonTrack data</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-600/5 border-orange-500/20">
                    <CardContent className="p-6 text-center">
                      <Award className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                      <div className="text-3xl font-bold text-white mb-2">
                        {spotify.album?.total_tracks || 'N/A'}
                      </div>
                      <p className="text-orange-400 font-medium">Album Tracks</p>
                      <p className="text-gray-500 text-xs mt-1">Spotify data</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Real SpotonTrack Playlist Data */}
              {spotontrack?.playlists?.spotifyPlaylists && spotontrack.playlists.spotifyPlaylists.length > 0 && (
                <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-gray-600/30">
                  <CardHeader>
                    <CardTitle className="text-white">Featured Spotify Playlists</CardTitle>
                    <p className="text-gray-400 text-sm">Real playlists featuring tracks like this (SpotonTrack data)</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      {spotontrack.playlists.spotifyPlaylists.map((playlist: any, index: number) => (
                        <div key={index} className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="bg-green-500/20 p-2 rounded-full">
                                <Radio className="w-5 h-5 text-green-400" />
                              </div>
                              <span className="text-gray-200 font-medium text-lg">{playlist.name}</span>
                            </div>
                            <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">
                              Position #{playlist.position}
                            </Badge>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <div className="text-gray-400">
                              <span className="text-gray-300 font-medium">{formatNumber(playlist.followers)}</span> followers
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">Playlist Reach</span>
                              <div className="w-24 bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ width: `${Math.min(100, (playlist.followers / 30000000) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-white font-medium text-sm">Playlist Impact Analysis</h4>
                          <p className="text-gray-400 text-sm mt-1">
                            This track appears in {spotontrack.playlists.total} playlists with a combined reach of {formatNumber(spotontrack.playlists.spotifyPlaylists.reduce((sum: number, p: {followers: number}) => sum + p.followers, 0))} followers.
                          </p>
                          <p className="text-gray-400 text-sm mt-2">
                            Added to {spotontrack.playlists.additions_last_week} new playlists in the past week, indicating {spotontrack.playlists.additions_last_week > 200 ? 'strong' : 'moderate'} curator interest.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Show when no SpotonTrack data available */}
              {!spotontrack?.playlists?.spotifyPlaylists && (
                <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-gray-600/30">
                  <CardHeader>
                    <CardTitle className="text-white">Playlists</CardTitle>
                    <p className="text-gray-400 text-sm">No SpotonTrack playlist data available for this track</p>
                  </CardHeader>
                </Card>
              )}

              {/* Track Information */}
              <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-gray-600/30">
                <CardHeader>
                  <CardTitle className="text-white">Track Information</CardTitle>
                  <p className="text-gray-400 text-sm">Detailed track metadata</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-white font-medium">Spotify Details</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Track #</span>
                          <span className="text-white">{spotify.track_number || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Duration</span>
                          <span className="text-white">{spotify.duration_ms ? formatDuration(spotify.duration_ms) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Explicit</span>
                          <span className="text-white">{spotify.explicit ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Preview</span>
                          <span className="text-white">{spotify.preview_url ? 'Available' : 'Not Available'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-white font-medium">SpotonTrack Analytics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Streams</span>
                          <span className="text-white">{spotontrack?.streams?.total ? formatNumber(spotontrack.streams.total) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Monthly Streams</span>
                          <span className="text-white">{spotontrack?.streams?.monthly ? formatNumber(spotontrack.streams.monthly) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Daily Streams</span>
                          <span className="text-white">{spotontrack?.streams?.daily ? formatNumber(spotontrack.streams.daily) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Playlist Count</span>
                          <span className="text-white">{spotontrack?.playlists?.total ? formatNumber(spotontrack.playlists.total) : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 border-green-500/20">
                  <CardContent className="p-6 text-center">
                    <Award className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-white mb-2">
                      {spotify.popularity || 'N/A'}
                    </div>
                    <p className="text-green-400 font-medium">Spotify Score</p>
                    <p className="text-gray-500 text-xs mt-1">Real-time</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-600/5 border-blue-500/20">
                  <CardContent className="p-6 text-center">
                    <Star className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-white mb-2">
                      {spotontrack?.marketData?.commercial_appeal || 'N/A'}
                    </div>
                    <p className="text-blue-400 font-medium">Commercial Appeal</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {spotontrack?.marketData?.commercial_appeal ? 'SpotonTrack data' : 'No data available'}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500/10 to-orange-600/5 border-red-500/20">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-white mb-2">
                      {spotontrack?.marketData?.virality_score || 'N/A'}
                    </div>
                    <p className="text-red-400 font-medium">Virality Score</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {spotontrack?.marketData?.virality_score ? 'SpotonTrack data' : 'No data available'}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-600/5 border-yellow-500/20">
                  <CardContent className="p-6 text-center">
                    <BarChart3 className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-white mb-2">
                      {spotontrack?.charts?.peak_position || 'N/A'}
                    </div>
                    <p className="text-yellow-400 font-medium">Peak Chart Position</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {spotontrack?.charts?.peak_position ? 'SpotonTrack data' : 'No data available'}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Chart Performance Details */}
              {spotontrack?.charts && (
                <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-gray-600/30">
                  <CardHeader>
                    <CardTitle className="text-white">Chart Performance</CardTitle>
                    <p className="text-gray-400 text-sm">Real chart positions and performance data from SpotonTrack</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-white font-medium mb-3">Global Charts</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                            <span className="text-gray-300">Spotify Global</span>
                            <span className="text-green-400 font-medium">
                              {spotontrack.charts.spotify_global ? `#${spotontrack.charts.spotify_global}` : 'Not Charting'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                            <span className="text-gray-300">Spotify US</span>
                            <span className="text-blue-400 font-medium">
                              {spotontrack.charts.spotify_us ? `#${spotontrack.charts.spotify_us}` : 'Not Charting'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                            <span className="text-gray-300">Apple Music</span>
                            <span className="text-purple-400 font-medium">
                              {spotontrack.charts.apple_music ? `#${spotontrack.charts.apple_music}` : 'Not Charting'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                            <span className="text-gray-300">Peak Position</span>
                            <span className="text-yellow-400 font-medium">
                              #{spotontrack.charts.peak_position}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-white font-medium mb-3">Market Analysis</h4>
                        <div className="space-y-3">
                          <div className="p-3 bg-gray-800/50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-400">Commercial Appeal</span>
                              <span className="text-white font-medium">{spotontrack.marketData?.commercial_appeal || 0}/100</span>
                            </div>
                            <Progress value={spotontrack.marketData?.commercial_appeal || 0} className="h-2" />
                          </div>
                          <div className="p-3 bg-gray-800/50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-400">Virality Score</span>
                              <span className="text-white font-medium">{spotontrack.marketData?.virality_score || 0}/100</span>
                            </div>
                            <Progress value={spotontrack.marketData?.virality_score || 0} className="h-2" />
                          </div>
                          <div className="p-3 bg-gray-800/50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-400">Market Popularity</span>
                              <span className="text-white font-medium">{spotontrack.marketData?.popularity || 0}/100</span>
                            </div>
                            <Progress value={spotontrack.marketData?.popularity || 0} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Title mismatch version */}
              {!spotontrack?.charts && (
                <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-gray-600/30">
                  <CardHeader>
                    <CardTitle className="text-white">Chart Performance</CardTitle>
                    <p className="text-gray-400 text-sm">Data unavailable due to track title mismatch</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
                      <h3 className="text-white font-medium text-lg mb-2">Chart Data Not Available</h3>
                      <p className="text-gray-400 max-w-md">
                        We couldn't find exact chart performance data for this track. This may be due to a title mismatch between 
                        Spotify and SpotonTrack databases.
                      </p>
                      <div className="mt-4 p-3 bg-gray-800/70 rounded-lg max-w-md">
                        <p className="text-sm text-gray-300 mb-2">
                          <span className="text-blue-400 font-medium">Spotify Title:</span> {spotify.name}
                        </p>
                        <p className="text-sm text-gray-300">
                          <span className="text-yellow-400 font-medium">SpotonTrack Search:</span> {trackName}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Chart history graph */}
              <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-gray-600/30 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-white">Chart History</CardTitle>
                  <p className="text-gray-400 text-sm">
                    {!spotontrack?.chartHistory ? 
                      "No chart history data available" : 
                      "Weekly chart positions over time"
                    }
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="w-full h-64 flex items-center justify-center">
                    {!spotontrack?.chartHistory ? (
                      <div className="text-center">
                        <Activity className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400">No chart history data available for this track.</p>
                        <p className="text-gray-500 text-sm mt-2">SpotonTrack data not available.</p>
                      </div>
                    ) : spotontrack?.chartHistory ? (
                      <ChartHistoryPlaceholder />
                    ) : (
                      <div className="text-center">
                        <Activity className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400">No chart history data available for this track.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-gray-600/30">
                <CardHeader>
                  <CardTitle className="text-white">Performance Insights</CardTitle>
                  <p className="text-gray-400 text-sm">Combined analysis from Spotify and SpotonTrack</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-white font-medium mb-3">Spotify Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Popularity Score</span>
                          <span className="text-white font-medium">{spotify.popularity || 'N/A'}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Track Number</span>
                          <span className="text-white font-medium">#{spotify.track_number || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Explicit Content</span>
                          <span className="text-white font-medium">{spotify.explicit ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Duration</span>
                          <span className="text-white font-medium">{spotify.duration_ms ? formatDuration(spotify.duration_ms) : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-3">SpotonTrack Analytics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Streams</span>
                          <span className="text-white font-medium">{spotontrack?.streams?.total ? formatNumber(spotontrack.streams.total) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Monthly Streams</span>
                          <span className="text-white font-medium">{spotontrack?.streams?.monthly ? formatNumber(spotontrack.streams.monthly) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Playlist Features</span>
                          <span className="text-white font-medium">{spotontrack?.playlists?.total ? formatNumber(spotontrack.playlists.total) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Peak Chart Position</span>
                          <span className="text-white font-medium">#{spotontrack?.charts?.peak_position || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
