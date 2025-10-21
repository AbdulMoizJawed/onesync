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
import { SpotonTrackDataModal } from "./modals/spotontrack-data-modal"
import { SpotifyDataModal } from "./modals/spotify-data-modal"
import { MusoDataModal } from "./modals/muso-data-modal"

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
                      className="bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 rounded-t-sm w-4/5 group relative transition-all duration-200 shadow-md"
                      style={{ height: `${heightPercent}%` }}
                    >
                      {/* Tooltip */}
                      <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap transition-opacity shadow-lg">
                        Week of {new Date(entry.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: #{entry.position}
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
      <div className="w-full h-64 flex items-center justify-center flex-col">
        <Activity className="w-16 h-16 text-gray-700 mb-4" />
        <p className="text-gray-400 text-center">
          Chart history visualization will appear here when available
        </p>
        <p className="text-gray-500 text-sm mt-2 max-w-md text-center">
          This data is collected from SpotonTrack's analytics platform and updated weekly
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 animate-pulse">
        <CustomLoader size="lg" />
        <span className="ml-3 text-gray-400 font-medium">Loading track details...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-gray-800/90 border-gray-700 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <CardTitle className="text-white">Track Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-white text-xl font-medium mb-2 font-montserrat">Error Loading Track Details</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">{error}</p>
          <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 transition-colors px-6 shadow-md">
            Return to Results
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!trackDetails) {
    return (
      <Card className="bg-gray-800/90 border-gray-700 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <CardTitle className="text-white">Track Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Music className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-white text-xl font-medium mb-2 font-montserrat">No Track Details Found</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">We couldn't find detailed information for this track. Please try another search.</p>
          <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 transition-colors px-6 shadow-md">
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
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex-1">
            <div className="flex items-center text-sm text-gray-400 mb-2">
              <span className="hover:text-gray-300 cursor-pointer transition-colors" onClick={onBack}>
                Search Results
              </span>
              <span className="mx-2">•</span>
              <span className="text-gray-300">Track Details</span>
            </div>
            <CardTitle className="text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-blue-400" />
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
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-0 w-full bg-gray-800/70 rounded-lg p-1 shadow-inner">
            <TabsTrigger value="overview" className="text-white font-medium text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-blue-600 data-[state=active]:shadow-sm transition-all duration-200">
              <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="streams" className="text-white font-medium text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-green-600 data-[state=active]:shadow-sm transition-all duration-200">
              <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Streams
            </TabsTrigger>
            <TabsTrigger value="playlists" className="text-white font-medium text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-purple-600 data-[state=active]:shadow-sm transition-all duration-200">
              <Radio className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Playlists
            </TabsTrigger>
            <TabsTrigger value="charts" className="text-white font-medium text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-orange-600 data-[state=active]:shadow-sm transition-all duration-200">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Charts
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Track Header */}
            <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-lg border border-gray-700/50 shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="w-32 h-32 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner ring-2 ring-gray-600/30">
                {combined.imageUrl ? (
                  <img 
                    src={combined.imageUrl} 
                    alt={combined.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <Music className="w-16 h-16 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1">
                                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight font-montserrat">
                  {trackDetails.title}
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
                  <p className="text-gray-400 mb-4 flex items-center gap-2">
                    <span className="text-gray-500">Album:</span> {combined.album}
                  </p>
                )}
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {spotify.popularity !== undefined && (
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                      <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-white">{spotify.popularity}</div>
                      <div className="text-gray-400 text-xs uppercase tracking-wide">Spotify Popularity</div>
                    </div>
                  )}
                  
                  {spotify.duration_ms && (
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                      <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-white">{formatDuration(spotify.duration_ms)}</div>
                      <div className="text-gray-400 text-xs uppercase tracking-wide">Duration</div>
                    </div>
                  )}
                  
                  {spotontrack?.streams?.total && (
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                      <Play className="w-5 h-5 text-green-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-white">{formatNumber(spotontrack.streams.total)}</div>
                      <div className="text-gray-400 text-xs uppercase tracking-wide">Total Streams</div>
                    </div>
                  )}
                  
                  {spotontrack?.playlists?.total && (
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                      <Radio className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-white">{formatNumber(spotontrack.playlists.total)}</div>
                      <div className="text-gray-400 text-xs uppercase tracking-wide">Playlists</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SpotifyDataModal 
                trackId={trackId}
                trackName={trackName}
                artistName={artistName}
                trigger={
                  <Button className="flex items-center justify-center gap-2 p-4 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg transition-colors w-full h-14 shadow-md">
                    <Play className="w-5 h-5" />
                    <span className="font-medium">Spotify Data</span>
                  </Button>
                }
              />
              
              <MusoDataModal
                trackId={trackId}
                trackName={trackName}
                artistName={artistName}
                trigger={
                  <Button className="flex items-center justify-center gap-2 p-4 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg transition-colors w-full h-14 shadow-md">
                    <Mic className="w-5 h-5" />
                    <span className="font-medium">MUSO Credits</span>
                  </Button>
                }
              />
              
              <SpotonTrackDataModal
                trackId={trackId}
                trackName={trackName}
                artistName={artistName}
                trigger={
                  <Button className="flex items-center justify-center gap-2 p-4 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-colors w-full h-14 shadow-md">
                    <BarChart3 className="w-5 h-5" />
                    <span className="font-medium">Streaming Analytics</span>
                  </Button>
                }
              />
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
            <div className="p-4 bg-gray-800/30 rounded-lg mb-6 text-center">
              <p className="text-gray-300">
                For more detailed streaming data and analytics, click below to open the streaming analytics modal
              </p>
              <div className="mt-4">
                <SpotonTrackDataModal
                  trackId={trackId}
                  trackName={trackName}
                  artistName={artistName}
                  trigger={
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      <span className="font-medium">View Detailed Streaming Analytics</span>
                    </Button>
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 border-green-500/20 hover:border-green-500/40 transition-all duration-300 shadow-md hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <Star className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">
                    {spotify.popularity || 'N/A'}
                  </div>
                  <p className="text-green-400 font-medium tracking-wide">Spotify Popularity</p>
                  <p className="text-gray-500 text-xs mt-1">Real-time data</p>
                </CardContent>
              </Card>
              
              {spotontrack?.streams?.total && (
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-600/5 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 shadow-md hover:shadow-lg">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-white mb-2">
                      {formatNumber(spotontrack.streams.total)}
                    </div>
                    <p className="text-blue-400 font-medium tracking-wide">Total Streams</p>
                    <p className="text-gray-500 text-xs mt-1">SpotonTrack data</p>
                  </CardContent>
                </Card>
              )}
              
              {spotontrack?.streams?.monthly && (
                <Card className="bg-gradient-to-br from-indigo-500/10 to-violet-600/5 border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-300 shadow-md hover:shadow-lg">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-white mb-2">
                      {formatNumber(spotontrack.streams.monthly)}
                    </div>
                    <p className="text-indigo-400 font-medium tracking-wide">Monthly Streams</p>
                    <p className="text-gray-500 text-xs mt-1">SpotonTrack data</p>
                  </CardContent>
                </Card>
              )}
              
              {spotontrack?.streams?.daily && (
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/5 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 shadow-md hover:shadow-lg">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-white mb-2">
                      {formatNumber(spotontrack.streams.daily)}
                    </div>
                    <p className="text-purple-400 font-medium tracking-wide">Daily Streams</p>
                    <p className="text-gray-500 text-xs mt-1">SpotonTrack data</p>
                  </CardContent>
                </Card>
              )}
            </div>
            
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
            <div className="p-4 bg-gray-800/30 rounded-lg mb-6 text-center">
              <p className="text-gray-300">
                For more detailed playlist data, click below to open the SpotonTrack analytics modal
              </p>
              <div className="mt-4">
                <SpotonTrackDataModal
                  trackId={trackId}
                  trackName={trackName}
                  artistName={artistName}
                  trigger={
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      <span className="font-medium">View Detailed Playlist Data</span>
                    </Button>
                  }
                />
              </div>
            </div>

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
                <div className="mt-6 flex justify-center gap-3">
                  <SpotifyDataModal 
                    trackId={trackId}
                    trackName={trackName}
                    artistName={artistName}
                    trigger={
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Play className="w-4 h-4 mr-2" />
                        <span className="font-medium">Spotify Data</span>
                      </Button>
                    }
                  />
                  
                  <MusoDataModal
                    trackId={trackId}
                    trackName={trackName}
                    artistName={artistName}
                    trigger={
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        <Mic className="w-4 h-4 mr-2" />
                        <span className="font-medium">MUSO Credits</span>
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6">
            <div className="p-4 bg-gray-800/30 rounded-lg mb-6 text-center">
              <p className="text-gray-300">
                For more detailed chart data, click below to open the SpotonTrack analytics modal
              </p>
              <div className="mt-4">
                <SpotonTrackDataModal
                  trackId={trackId}
                  trackName={trackName}
                  artistName={artistName}
                  trigger={
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      <span className="font-medium">View Detailed Chart Data</span>
                    </Button>
                  }
                />
              </div>
            </div>

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
            
            {/* Chart history graph */}
            <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-gray-600/30 overflow-hidden shadow-lg">
              <CardHeader className="border-b border-gray-700/30">
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Chart History
                </CardTitle>
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
                      <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
                      <p className="text-gray-400">No chart history data available for this track.</p>
                      <p className="text-gray-500 text-sm mt-2">SpotonTrack data not available.</p>
                    </div>
                  ) : spotontrack?.chartHistory ? (
                    <ChartHistoryPlaceholder />
                  ) : (
                    <div className="text-center">
                      <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
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
                <div className="mt-6 flex justify-center gap-3">
                  <SpotifyDataModal 
                    trackId={trackId}
                    trackName={trackName}
                    artistName={artistName}
                    trigger={
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Play className="w-4 h-4 mr-2" />
                        <span className="font-medium">Spotify Data</span>
                      </Button>
                    }
                  />
                  
                  <SpotonTrackDataModal
                    trackId={trackId}
                    trackName={trackName}
                    artistName={artistName}
                    trigger={
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        <span className="font-medium">SpotonTrack Details</span>
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
