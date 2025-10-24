'use client'

import { useState, useEffect } from 'react'
import { Search, TrendingUp, Globe, Music, Radio, Hash, Users, BarChart3, Activity, Calendar, ChevronDown, Loader2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { SpotifyIcon, AppleMusicIcon, DeezerIcon, ShazamIcon } from '@/components/platform-icons'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

const API_KEY = 'jgdRcPw42mGxmcgFb2icOopo4HCRbNkwfiefxeLCbc2f9fe8'

interface TrackSearchResult {
  name: string
  release_date: string
  artwork: string
  isrc: string
}

interface TrackMetadata {
  name: string
  release_date: string
  artwork: string
  isrc: string
  artists: Array<{
    id: number
    name: string
    image: string
  }>
  links: {
    spotify?: string[]
    apple?: string[]
    deezer?: string[]
    shazam?: string[]
  }
}

export default function IndustryStatsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TrackSearchResult[]>([])
  const [selectedTrack, setSelectedTrack] = useState<TrackMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [streamData, setStreamData] = useState<any[]>([])
  const [chartData, setChartData] = useState<any>({})
  const [playlistData, setPlaylistData] = useState<any>({})
  const [shazamData, setShazamData] = useState<any[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Track Search
  const searchTracks = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/spotontrack/tracks/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      })
      
      if (!response.ok) throw new Error('Search failed')
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load Track Details
  const loadTrackDetails = async (isrc: string) => {
    console.log('🎵 Loading track details for ISRC:', isrc)
    setLoading(true)
    setSelectedTrack(null) // Clear current selection
    
    try {
      // Get track metadata
      const metaResponse = await fetch('/api/spotontrack/tracks/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isrc })
      })
      
      if (!metaResponse.ok) throw new Error('Failed to load track details')
      const metadata = await metaResponse.json()
      console.log('🎯 Track metadata loaded:', metadata)
      setSelectedTrack(metadata)

      // Load all platform data in parallel
      await Promise.all([
        loadSpotifyData(isrc),
        loadChartData(isrc),
        loadPlaylistData(isrc),
        loadShazamData(isrc)
      ])
    } catch (error) {
      console.error('Error loading track details:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load Spotify streaming data
  const loadSpotifyData = async (isrc: string) => {
    try {
      const response = await fetch('/api/spotontrack/tracks/spotify/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isrc })
      })
      
      if (response.ok) {
        const data = await response.json()
        setStreamData(data)
      }
    } catch (error) {
      console.error('Error loading Spotify data:', error)
    }
  }

  // Load chart data from all platforms
  const loadChartData = async (isrc: string) => {
    try {
      const [spotifyCharts, appleCharts, deezerCharts, shazamCharts] = await Promise.all([
        fetch('/api/spotontrack/tracks/spotify/charts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isrc })
        }).then(r => r.ok ? r.json() : null),
        
        fetch('/api/spotontrack/tracks/apple/charts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isrc })
        }).then(r => r.ok ? r.json() : null),
        
        fetch('/api/spotontrack/tracks/deezer/charts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isrc })
        }).then(r => r.ok ? r.json() : null),
        
        fetch('/api/spotontrack/tracks/shazam/charts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isrc })
        }).then(r => r.ok ? r.json() : null)
      ])

      setChartData({
        spotify: spotifyCharts || { current: [], peak: [] },
        apple: appleCharts || { current: [], peak: [] },
        deezer: deezerCharts || { current: [], peak: [] },
        shazam: shazamCharts || { current: [], peak: [] }
      })
    } catch (error) {
      console.error('Error loading chart data:', error)
    }
  }

  // Load playlist data
  const loadPlaylistData = async (isrc: string) => {
    try {
      const [spotifyPlaylists, applePlaylists, deezerPlaylists] = await Promise.all([
        fetch('/api/spotontrack/tracks/spotify/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isrc })
        }).then(r => r.ok ? r.json() : []),
        
        fetch('/api/spotontrack/tracks/apple/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isrc })
        }).then(r => r.ok ? r.json() : []),
        
        fetch('/api/spotontrack/tracks/deezer/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isrc })
        }).then(r => r.ok ? r.json() : [])
      ])

      setPlaylistData({
        spotify: spotifyPlaylists,
        apple: applePlaylists,
        deezer: deezerPlaylists
      })
    } catch (error) {
      console.error('Error loading playlist data:', error)
    }
  }

  // Load Shazam data
  const loadShazamData = async (isrc: string) => {
    try {
      const response = await fetch('/api/spotontrack/tracks/shazam/shazams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isrc })
      })
      
      if (response.ok) {
        const data = await response.json()
        setShazamData(data)
      }
    } catch (error) {
      console.error('Error loading Shazam data:', error)
    }
  }

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Calculate total streams
  const totalStreams = streamData.length > 0 ? streamData[0]?.total || 0 : 0
  const dailyStreams = streamData.length > 0 ? streamData[0]?.daily || 0 : 0

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar 
        // collapsed={sidebarCollapsed}
        // onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-gray-950">
          <div className="container mx-auto p-6 max-w-6xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="font-montserrat text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Industry Stats Dashboard
              </h1>
              <p className="font-inter text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Real-time music analytics across Spotify, Apple Music, Deezer & Shazam powered by SpotOnTrack
              </p>
            </div>

      {/* Search Section */}
      <Card className="mb-6 gradient-bg-card shadow-lg mx-auto max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="font-montserrat flex items-center justify-center gap-2">
            <Search className="w-5 h-5 text-purple-600" />
            Track Search
          </CardTitle>
          <CardDescription className="font-inter">
            Search by track name, artist, or paste Spotify/Apple/Deezer/Shazam links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 max-w-2xl mx-auto">
            <Input
              placeholder="Enter track name or streaming service URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchTracks()}
              className="flex-1"
            />
            <Button 
              onClick={searchTracks} 
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((track) => (
                <div
                  key={track.isrc}
                  className={`flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors ${
                    selectedTrack?.isrc === track.isrc 
                      ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-400' 
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => loadTrackDetails(track.isrc)}
                >
                  <img
                    src={track.artwork || '/placeholder.jpg'}
                    alt={track.name}
                    className="w-12 h-12 rounded object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.jpg'
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-montserrat font-medium">{track.name}</p>
                    <p className="font-inter text-sm text-muted-foreground">
                      Released: {new Date(track.release_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{track.isrc}</Badge>
                    {selectedTrack?.isrc === track.isrc && (
                      <Badge variant="default" className="bg-purple-600">
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Track Details */}
      {selectedTrack ? (
        <>
          {/* Track Header */}
          <Card className="mb-6 gradient-bg-card shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                <img
                  src={selectedTrack.artwork || '/placeholder.jpg'}
                  alt={selectedTrack.name}
                  className="w-32 h-32 rounded-lg shadow-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.jpg'
                  }}
                />
                <div className="flex-1">
                  <h2 className="font-montserrat text-3xl font-bold mb-1">{selectedTrack.name}</h2>
                  <p className="font-inter text-xl mb-3">
                    {selectedTrack.artists.map(a => a.name).join(', ')}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="text-sm">{selectedTrack.isrc}</Badge>
                    <Badge variant="secondary">
                      Released: {new Date(selectedTrack.release_date).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrack.links.spotify?.map((link, i) => (
                      <Button key={i} size="sm" variant="outline" asChild>
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          <SpotifyIcon className="w-4 h-4 mr-1 text-gray-600" />
                          Spotify
                        </a>
                      </Button>
                    ))}
                    {selectedTrack.links.apple?.map((link, i) => (
                      <Button key={i} size="sm" variant="outline" asChild>
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          <AppleMusicIcon className="w-4 h-4 mr-1 text-gray-600" />
                          Apple Music
                        </a>
                      </Button>
                    ))}
                    {selectedTrack.links.deezer?.map((link, i) => (
                      <Button key={i} size="sm" variant="outline" asChild>
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          <DeezerIcon className="w-4 h-4 mr-1 text-gray-600" />
                          Deezer
                        </a>
                      </Button>
                    ))}
                    {selectedTrack.links.shazam?.map((link, i) => (
                      <Button key={i} size="sm" variant="outline" asChild>
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          <ShazamIcon className="w-4 h-4 mr-1 text-gray-600" />
                          Shazam
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-montserrat text-sm font-medium">Total Streams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatNumber(totalStreams)}</div>
                    <p className="font-inter text-xs text-muted-foreground">Spotify</p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-montserrat text-sm font-medium">Daily Streams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{formatNumber(dailyStreams)}</div>
                    <p className="text-xs text-muted-foreground">Last 24h</p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-montserrat text-sm font-medium">Total Shazams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {shazamData.length > 0 ? formatNumber(shazamData[0]?.total || 0) : '0'}
                    </div>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-montserrat text-sm font-medium">Chart Positions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {chartData.spotify?.current?.length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Active charts</p>
                  </CardContent>
                </Card>
              </div>

              {/* Streaming Trend */}
              {streamData.length > 0 && (
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="font-montserrat">Spotify Streaming Trend</CardTitle>
                    <CardDescription>Daily streams over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={streamData.slice().reverse()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis tickFormatter={(value) => formatNumber(value)} />
                        <Tooltip 
                          formatter={(value: any) => formatNumber(value)}
                          labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="daily" 
                          stroke="#8b5cf6" 
                          fill="#8b5cf6" 
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Shazam Trend */}
              {shazamData.length > 0 && (
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="font-montserrat">Shazam Discovery Trend</CardTitle>
                    <CardDescription>Daily Shazams over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={shazamData.slice().reverse()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis tickFormatter={(value) => formatNumber(value)} />
                        <Tooltip 
                          formatter={(value: any) => formatNumber(value)}
                          labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="daily" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Charts Tab */}
            <TabsContent value="charts" className="space-y-6">
              {/* Current Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Spotify Charts */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">♪</span>
                      </div>
                      Spotify Charts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {chartData.spotify?.current?.length > 0 ? (
                        <div className="space-y-3">
                          {chartData.spotify.current.map((chart: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant={chart.type === 'streams' ? 'default' : 'secondary'}>
                                    {chart.type}
                                  </Badge>
                                  <span className="font-medium">
                                    {chart.country_code === 'GLOBAL' ? 'Global' : chart.country_code}
                                  </span>
                                </div>
                                <Badge variant="outline">{chart.frequency}</Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="text-2xl font-bold">#{chart.position}</div>
                                  {chart.previous_position && (
                                    <div className="text-sm">
                                      {chart.position < chart.previous_position ? (
                                        <span className="text-green-600">↑ {chart.previous_position - chart.position}</span>
                                      ) : chart.position > chart.previous_position ? (
                                        <span className="text-red-600">↓ {chart.position - chart.previous_position}</span>
                                      ) : (
                                        <span className="text-muted-foreground">→</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {chart.streams && (
                                  <div className="text-right">
                                    <div className="font-medium">{formatNumber(chart.streams)}</div>
                                    <div className="text-xs text-muted-foreground">streams</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No chart data available</p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Apple Music Charts */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-900 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">🍎</span>
                      </div>
                      Apple Music Charts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {chartData.apple?.current?.length > 0 ? (
                        <div className="space-y-3">
                          {chartData.apple.current.map((chart: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{chart.country_code}</span>
                                <Badge variant="outline">{chart.genre}</Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-2xl font-bold">#{chart.position}</div>
                                {chart.previous_position && (
                                  <div className="text-sm">
                                    {chart.position < chart.previous_position ? (
                                      <span className="text-green-600">↑ {chart.previous_position - chart.position}</span>
                                    ) : chart.position > chart.previous_position ? (
                                      <span className="text-red-600">↓ {chart.position - chart.previous_position}</span>
                                    ) : (
                                      <span className="text-muted-foreground">→</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No chart data available</p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Deezer Charts */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">D</span>
                      </div>
                      Deezer Charts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {chartData.deezer?.current?.length > 0 ? (
                        <div className="space-y-3">
                          {chartData.deezer.current.map((chart: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">
                                  {chart.country_code === 'GLOBAL' ? 'Global' : chart.country_code}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-2xl font-bold">#{chart.position}</div>
                                {chart.previous_position && (
                                  <div className="text-sm">
                                    {chart.position < chart.previous_position ? (
                                      <span className="text-green-600">↑ {chart.previous_position - chart.position}</span>
                                    ) : chart.position > chart.previous_position ? (
                                      <span className="text-red-600">↓ {chart.position - chart.previous_position}</span>
                                    ) : (
                                      <span className="text-muted-foreground">→</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No chart data available</p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Shazam Charts */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Radio className="w-5 h-5 text-blue-600" />
                      Shazam Charts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {chartData.shazam?.current?.length > 0 ? (
                        <div className="space-y-3">
                          {chartData.shazam.current.map((chart: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">
                                  {chart.country_code === 'GLOBAL' ? 'Global' : chart.country_code}
                                </span>
                                <div className="flex gap-2">
                                  <Badge variant="outline">{chart.type}</Badge>
                                  {chart.city && <Badge variant="secondary">{chart.city}</Badge>}
                                  {chart.genre && <Badge variant="secondary">{chart.genre}</Badge>}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-2xl font-bold">#{chart.position}</div>
                                {chart.previous_position && (
                                  <div className="text-sm">
                                    {chart.position < chart.previous_position ? (
                                      <span className="text-green-600">↑ {chart.previous_position - chart.position}</span>
                                    ) : chart.position > chart.previous_position ? (
                                      <span className="text-red-600">↓ {chart.position - chart.previous_position}</span>
                                    ) : (
                                      <span className="text-muted-foreground">→</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No chart data available</p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Playlists Tab */}
            <TabsContent value="playlists" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Spotify Playlists */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="w-5 h-5 text-green-600" />
                      Spotify Playlists
                    </CardTitle>
                    <CardDescription>
                      {playlistData.spotify?.length || 0} playlists
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      {playlistData.spotify?.length > 0 ? (
                        <div className="space-y-3">
                          {playlistData.spotify.map((item: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg border">
                              <div className="flex items-start gap-3">
                                <img
                                  src={item.playlist.artwork || '/placeholder.jpg'}
                                  alt={item.playlist.name}
                                  className="w-12 h-12 rounded object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder.jpg'
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{item.playlist.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatNumber(item.playlist.followers)} followers
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary">#{item.position}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Added {new Date(item.added_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No playlist data available</p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Apple Music Playlists */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="w-5 h-5 text-gray-800" />
                      Apple Music Playlists
                    </CardTitle>
                    <CardDescription>
                      {playlistData.apple?.length || 0} playlists
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      {playlistData.apple?.length > 0 ? (
                        <div className="space-y-3">
                          {playlistData.apple.map((item: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg border">
                              <div className="flex items-start gap-3">
                                <img
                                  src={item.playlist.artwork || '/placeholder.jpg'}
                                  alt={item.playlist.name}
                                  className="w-12 h-12 rounded object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder.jpg'
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{item.playlist.name}</p>
                                  <div className="mt-2 space-y-1">
                                    {item.countries.slice(0, 3).map((country: any, j: number) => (
                                      <div key={j} className="flex items-center gap-2 text-sm">
                                        <Badge variant="outline" className="text-xs">
                                          {country.country_code}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                          #{country.position}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(country.added_at).toLocaleDateString()}
                                        </span>
                                      </div>
                                    ))}
                                    {item.countries.length > 3 && (
                                      <p className="text-xs text-muted-foreground">
                                        +{item.countries.length - 3} more countries
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No playlist data available</p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Deezer Playlists */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="w-5 h-5 text-orange-600" />
                      Deezer Playlists
                    </CardTitle>
                    <CardDescription>
                      {playlistData.deezer?.length || 0} playlists
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      {playlistData.deezer?.length > 0 ? (
                        <div className="space-y-3">
                          {playlistData.deezer.map((item: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg border">
                              <div className="flex items-start gap-3">
                                <img
                                  src={item.playlist.artwork || '/placeholder.jpg'}
                                  alt={item.playlist.name}
                                  className="w-12 h-12 rounded object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder.jpg'
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{item.playlist.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatNumber(item.playlist.followers)} followers
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary">#{item.position}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Added {new Date(item.added_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No playlist data available</p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              {/* Platform Distribution */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Platform Performance Overview</CardTitle>
                  <CardDescription>Compare performance across streaming platforms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Chart Presence */}
                    <div>
                      <h4 className="font-medium mb-4">Chart Presence by Platform</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4" />
                            <span>Spotify</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {chartData.spotify?.current?.length || 0} charts
                            </span>
                            <Progress 
                              value={(chartData.spotify?.current?.length || 0) * 5} 
                              className="w-24"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4" />
                            <span>Apple Music</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {chartData.apple?.current?.length || 0} charts
                            </span>
                            <Progress 
                              value={(chartData.apple?.current?.length || 0) * 5} 
                              className="w-24"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4" />
                            <span>Deezer</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {chartData.deezer?.current?.length || 0} charts
                            </span>
                            <Progress 
                              value={(chartData.deezer?.current?.length || 0) * 5} 
                              className="w-24"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Radio className="w-4 h-4" />
                            <span>Shazam</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {chartData.shazam?.current?.length || 0} charts
                            </span>
                            <Progress 
                              value={(chartData.shazam?.current?.length || 0) * 5} 
                              className="w-24"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Playlist Coverage */}
                    <div>
                      <h4 className="font-medium mb-4">Playlist Coverage</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>Total Playlists</span>
                          </div>
                          <span className="text-2xl font-bold">
                            {(playlistData.spotify?.length || 0) + 
                             (playlistData.apple?.length || 0) + 
                             (playlistData.deezer?.length || 0)}
                          </span>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Spotify</span>
                            <span className="font-medium">{playlistData.spotify?.length || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Apple Music</span>
                            <span className="font-medium">{playlistData.apple?.length || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Deezer</span>
                            <span className="font-medium">{playlistData.deezer?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                  <CardDescription>Key insights and metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Streaming Growth</h4>
                      <div className="text-2xl font-bold">
                        {streamData.length >= 2 ? (
                          <>
                            {((streamData[0]?.daily - streamData[1]?.daily) / streamData[1]?.daily * 100).toFixed(1)}%
                          </>
                        ) : 'N/A'}
                      </div>
                      <p className="text-sm text-muted-foreground">Daily change</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Discovery Rate</h4>
                      <div className="text-2xl font-bold">
                        {shazamData.length > 0 ? formatNumber(shazamData[0]?.daily || 0) : 'N/A'}
                      </div>
                      <p className="text-sm text-muted-foreground">Daily Shazams</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Market Reach</h4>
                      <div className="text-2xl font-bold">
                        {(() => {
                          const countries = new Set()
                          ;[chartData.spotify, chartData.apple, chartData.deezer, chartData.shazam].forEach(platform => {
                            platform?.current?.forEach((chart: any) => {
                              if (chart.country_code && chart.country_code !== 'GLOBAL') {
                                countries.add(chart.country_code)
                              }
                            })
                          })
                          return countries.size
                        })()}
                      </div>
                      <p className="text-sm text-muted-foreground">Countries</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        // Welcome Section - Show when no track is selected
        <div className="space-y-6">
          {/* Hero Section */}
          <Card className="bg-gradient-to-br from-gray-900/20 to-gray-800/20 border-gray-600/20">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="max-w-2xl mx-auto">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <BarChart3 className="w-16 h-16 text-gray-400" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Welcome to Industry Stats
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Get real-time analytics across Spotify, Apple Music, Deezer & Shazam. 
                  Search for any track to unlock comprehensive streaming data, chart positions, and playlist analytics.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span>Real-time Data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span>Global Charts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-gray-400" />
                    <span>Playlist Analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span>Shazam Data</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-gray-600/30 hover:border-gray-500/40 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gray-600/10 rounded-lg flex items-center justify-center">
                    <Music className="w-5 h-5 text-gray-400" />
                  </div>
                  <Badge variant="outline" className="text-gray-400 border-gray-600/30">Live</Badge>
                </div>
                <h3 className="font-semibold mb-2">Spotify Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Stream counts, playlist placements, and global chart positions
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-600/30 hover:border-gray-500/40 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gray-500/10 rounded-lg flex items-center justify-center">
                    <Music className="w-5 h-5 text-gray-400" />
                  </div>
                  <Badge variant="outline" className="text-gray-400 border-gray-600/30">Live</Badge>
                </div>
                <h3 className="font-semibold mb-2">Apple Music</h3>
                <p className="text-sm text-muted-foreground">
                  iTunes charts, radio play, and streaming metrics
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-600/30 hover:border-gray-500/40 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gray-600/10 rounded-lg flex items-center justify-center">
                    <Music className="w-5 h-5 text-gray-400" />
                  </div>
                  <Badge variant="outline" className="text-gray-400 border-gray-600/30">Live</Badge>
                </div>
                <h3 className="font-semibold mb-2">Deezer</h3>
                <p className="text-sm text-muted-foreground">
                  European streaming data and regional chart performance
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-600/30 hover:border-gray-500/40 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gray-600/10 rounded-lg flex items-center justify-center">
                    <Hash className="w-5 h-5 text-gray-400" />
                  </div>
                  <Badge variant="outline" className="text-gray-400 border-gray-600/30">Live</Badge>
                </div>
                <h3 className="font-semibold mb-2">Shazam</h3>
                <p className="text-sm text-muted-foreground">
                  Music discovery trends and recognition data
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Start Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-400" />
                Quick Start Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-lg border border-dashed border-gray-600/30">
                  <div className="w-12 h-12 bg-gray-600/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg font-bold text-gray-400">1</span>
                  </div>
                  <h4 className="font-semibold mb-2">Search Track</h4>
                  <p className="text-sm text-muted-foreground">
                    Enter track name, artist, or paste streaming platform links
                  </p>
                </div>
                
                <div className="text-center p-4 rounded-lg border border-dashed border-gray-600/30">
                  <div className="w-12 h-12 bg-gray-600/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg font-bold text-pink-500">2</span>
                  </div>
                  <h4 className="font-semibold mb-2">Select Track</h4>
                  <p className="text-sm text-muted-foreground">
                    Click on any search result to load comprehensive analytics
                  </p>
                </div>
                
                <div className="text-center p-4 rounded-lg border border-dashed border-gray-600/30">
                  <div className="w-12 h-12 bg-gray-600/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg font-bold text-gray-400">3</span>
                  </div>
                  <h4 className="font-semibold mb-2">Analyze Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Explore charts, streams, playlists, and Shazam analytics
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sample Data Showcase */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-400" />
                What You'll Get
              </CardTitle>
              <CardDescription>
                Comprehensive analytics across all major platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sample Chart */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Streaming Analytics
                  </h4>
                  <div className="h-48 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-lg border border-gray-600/20 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-gray-400/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Real-time streaming charts</p>
                    </div>
                  </div>
                </div>

                {/* Sample Data Points */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Key Metrics
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Comprehensive analytics across all major platforms. What you&apos;ll get.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-600/5 border border-gray-600/20">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">Total Streams</span>
                      </div>
                      <Badge variant="outline" className="text-gray-400 border-gray-600/30">Live Data</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-600/5 border border-gray-600/20">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">Chart Positions</span>
                      </div>
                      <Badge variant="outline" className="text-gray-400 border-gray-600/30">Global</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-600/5 border border-gray-600/20">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">Playlist Placements</span>
                      </div>
                      <Badge variant="outline" className="text-gray-400 border-gray-600/30">Editorial</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-600/5 border border-gray-600/20">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">Shazam Recognition</span>
                      </div>
                      <Badge variant="outline" className="text-gray-400 border-gray-600/30">Trending</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
          </div>
        </main>
      </div>
    </div>
  )
}
