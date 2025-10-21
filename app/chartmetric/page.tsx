'use client'

import { useState, useEffect } from 'react'
import { Search, Music, Users, PlayCircle, Disc, MapPin, PenTool, TrendingUp, ExternalLink, Play, Pause, Volume2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OptimizedImage } from '@/components/optimized-image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ChartmetricSearchResponse, ChartmetricArtist, ChartmetricTrack, ChartmetricTrackDetails } from '@/lib/chartmetric-api'

interface SearchFilters {
  type: 'all' | 'artists' | 'tracks' | 'playlists' | 'curators' | 'albums' | 'stations' | 'cities' | 'songwriters'
  limit: number
  beta: boolean
  platforms: string[]
  triggerCitiesOnly: boolean
}

export default function ChartmetricPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ChartmetricSearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<ChartmetricTrackDetails | null>(null)
  const [trackDetailsLoading, setTrackDetailsLoading] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    limit: 20,
    beta: true,
    platforms: [],
    triggerCitiesOnly: false,
  })

  const platforms = [
    { id: 'spotify', name: 'Spotify' },
    { id: 'itunes', name: 'iTunes' },
    { id: 'applemusic', name: 'Apple Music' },
    { id: 'deezer', name: 'Deezer' },
    { id: 'amazon', name: 'Amazon' },
    { id: 'youtube', name: 'YouTube' },
    { id: 'tidal', name: 'Tidal' },
    { id: 'soundcloud', name: 'SoundCloud' },
  ]

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query')
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        action: 'search',
        q: searchQuery,
        limit: filters.limit.toString(),
        type: filters.type,
        beta: filters.beta.toString(),
        triggerCitiesOnly: filters.triggerCitiesOnly.toString(),
      })

      if (filters.platforms.length > 0) {
        filters.platforms.forEach(platform => {
          params.append('platforms', platform)
        })
      }

      const response = await fetch(`/api/chartmetric?${params}`)
      if (!response.ok) {
        throw new Error('Failed to search')
      }

      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      toast.error('Failed to search Chartmetric')
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTrackDetails = async (trackId: number) => {
    setTrackDetailsLoading(true)
    try {
      const response = await fetch(`/api/chartmetric?action=track&trackId=${trackId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch track details')
      }

      const data = await response.json()
      setSelectedTrack(data)
    } catch (error) {
      toast.error('Failed to fetch track details')
      console.error('Track details error:', error)
    } finally {
      setTrackDetailsLoading(false)
    }
  }

  const formatNumber = (num: number | string | undefined) => {
    if (!num) return 'N/A'
    const n = typeof num === 'string' ? parseInt(num) : num
    return n.toLocaleString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Chartmetric Search
          </h1>
          <p className="text-gray-400">
            Search tracks, albums, artists, curators, playlists, and more with Chartmetric&apos;s comprehensive music database
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8 glass border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Music Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Input */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search for artists, tracks, albums, or enter URLs (Spotify, Apple Music, etc.)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-300 mb-2 block">Search Type</Label>
                <Select 
                  value={filters.type} 
                  onValueChange={(value: any) => setFilters({...filters, type: value})}
                >
                  <SelectTrigger className="bg-gray-800/50 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-gray-800">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="artists">Artists</SelectItem>
                    <SelectItem value="tracks">Tracks</SelectItem>
                    <SelectItem value="albums">Albums</SelectItem>
                    <SelectItem value="playlists">Playlists</SelectItem>
                    <SelectItem value="curators">Curators</SelectItem>
                    <SelectItem value="cities">Cities</SelectItem>
                    <SelectItem value="songwriters">Songwriters</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">Results Limit</Label>
                <Select 
                  value={filters.limit.toString()} 
                  onValueChange={(value: string) => setFilters({...filters, limit: parseInt(value)})}
                >
                  <SelectTrigger className="bg-gray-800/50 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-gray-800">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="beta" 
                  checked={filters.beta}
                  onCheckedChange={(checked: boolean) => setFilters({...filters, beta: checked})}
                  className="border-gray-600"
                />
                <Label htmlFor="beta" className="text-gray-300">
                  Beta Search (Enhanced)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="triggerCities" 
                  checked={filters.triggerCitiesOnly}
                  onCheckedChange={(checked: boolean) => setFilters({...filters, triggerCitiesOnly: checked})}
                  className="border-gray-600"
                />
                <Label htmlFor="triggerCities" className="text-gray-300">
                  Trigger Cities Only
                </Label>
              </div>
            </div>

            {/* Platform Filters */}
            <div>
              <Label className="text-gray-300 mb-2 block">Platforms (Beta only)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {platforms.map((platform) => (
                  <div key={platform.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={platform.id}
                      checked={filters.platforms.includes(platform.id)}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setFilters({
                            ...filters,
                            platforms: [...filters.platforms, platform.id]
                          })
                        } else {
                          setFilters({
                            ...filters,
                            platforms: filters.platforms.filter(p => p !== platform.id)
                          })
                        }
                      }}
                      className="border-gray-600"
                    />
                    <Label htmlFor={platform.id} className="text-sm text-gray-300">
                      {platform.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {searchResults && (
          <Tabs defaultValue="artists" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7 bg-gray-800/50">
              <TabsTrigger value="artists" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Artists ({searchResults.artists?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="tracks" className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                Tracks ({searchResults.tracks?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="albums" className="flex items-center gap-2">
                <Disc className="w-4 h-4" />
                Albums ({searchResults.albums?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="playlists" className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4" />
                Playlists
              </TabsTrigger>
              <TabsTrigger value="curators">
                Curators
              </TabsTrigger>
              <TabsTrigger value="cities" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Cities ({searchResults.cities?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="songwriters" className="flex items-center gap-2">
                <PenTool className="w-4 h-4" />
                Writers ({searchResults.songwriters?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Artists Results */}
            <TabsContent value="artists">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.artists?.map((artist) => (
                  <Card key={artist.id} className="glass border-gray-800 hover:border-gray-600 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        {artist.image_url && (
                          <OptimizedImage
                            src={artist.image_url}
                            alt={artist.name}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-full object-cover"
                            fallback="user"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{artist.name}</h3>
                          <p className="text-sm text-gray-400 mb-2">ID: {artist.id}</p>
                          
                          <div className="space-y-1 text-sm">
                            {artist.sp_monthly_listeners && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Monthly Listeners:</span>
                                <span className="text-green-400">{formatNumber(artist.sp_monthly_listeners)}</span>
                              </div>
                            )}
                            {artist.sp_followers && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Followers:</span>
                                <span className="text-blue-400">{formatNumber(artist.sp_followers)}</span>
                              </div>
                            )}
                            {artist.cm_artist_score && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">CM Score:</span>
                                <span className="text-purple-400">{formatNumber(artist.cm_artist_score)}</span>
                              </div>
                            )}
                          </div>

                          {artist.isni && (
                            <Badge className="mt-2 text-xs border-gray-600">
                              ISNI: {artist.isni}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Tracks Results */}
            <TabsContent value="tracks">
              <div className="grid grid-cols-1 gap-4">
                {searchResults.tracks?.map((track) => (
                  <Card 
                    key={track.id} 
                    className="glass border-gray-800 hover:border-gray-600 transition-colors cursor-pointer"
                    onClick={() => handleTrackDetails(parseInt(track.cm_track))}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        {track.image_url && (
                          <OptimizedImage
                            src={track.image_url}
                            alt={track.name}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded object-cover"
                            fallback="music"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{track.name}</h3>
                          <p className="text-blue-400 mb-2">{track.artist_names?.join(', ')}</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">ISRC:</span>
                              <span className="ml-2 text-gray-200">{track.isrc || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Track ID:</span>
                              <span className="ml-2 text-gray-200">{track.cm_track}</span>
                            </div>
                          </div>

                          {track.album && track.album.length > 0 && (
                            <div className="mt-2">
                              <span className="text-gray-400 text-sm">Album:</span>
                              <span className="ml-2 text-gray-200 text-sm">
                                {track.album[0].name} ({formatDate(track.album[0].release_date)})
                              </span>
                            </div>
                          )}

                          <Badge className="mt-2 border-gray-600">
                            Click for details
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Albums Results */}
            <TabsContent value="albums">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.albums?.map((album) => (
                  <Card key={album.id} className="glass border-gray-800 hover:border-gray-600 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        {album.image_url && (
                            <OptimizedImage
                              src={album.image_url}
                              alt={album.name}
                              width={64}
                              height={64}
                              className="w-16 h-16 rounded object-cover"
                              fallback="music"
                            />
                          )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{album.name}</h3>
                          <p className="text-gray-400 text-sm mb-2">{album.label}</p>
                          <Badge className="text-xs border-gray-600">
                            ID: {album.id}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Playlists Results */}
            <TabsContent value="playlists">
              <div className="space-y-6">
                {Object.entries(searchResults.playlists || {}).map(([platform, playlists]) => (
                  <div key={platform}>
                    <h3 className="text-xl font-semibold mb-4 capitalize flex items-center gap-2">
                      <PlayCircle className="w-5 h-5" />
                      {platform} Playlists ({playlists.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {playlists.map((playlist) => (
                        <Card key={playlist.id} className="glass border-gray-800 hover:border-gray-600 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              {playlist.image_url && (
                                <OptimizedImage
                                  src={playlist.image_url}
                                  alt={playlist.name}
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 rounded object-cover"
                                  fallback="music"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate">{playlist.name}</h4>
                                <p className="text-sm text-gray-400 truncate">{playlist.owner_name}</p>
                                <Badge className="text-xs mt-1 border-gray-600">
                                  {platform}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Curators Results */}
            <TabsContent value="curators">
              <div className="space-y-6">
                {Object.entries(searchResults.curators || {}).map(([platform, curators]) => (
                  <div key={platform}>
                    <h3 className="text-xl font-semibold mb-4 capitalize">
                      {platform} Curators ({curators.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {curators.map((curator) => (
                        <Card key={curator.id} className="glass border-gray-800">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              {curator.image_url && (
                                <OptimizedImage
                                  src={curator.image_url}
                                  alt={curator.name}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 rounded-full object-cover"
                                  fallback="user"
                                />
                              )}
                              <div>
                                <h4 className="font-medium">{curator.name}</h4>
                                <Badge className="text-xs border-gray-600">
                                  {platform}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Cities Results */}
            <TabsContent value="cities">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.cities?.map((city) => (
                  <Card key={city.id} className="glass border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{city.name}</h4>
                          <p className="text-sm text-gray-400">{city.country} ({city.code2})</p>
                          <p className="text-sm text-gray-500">Population: {formatNumber(city.population)}</p>
                          {city.province && (
                            <p className="text-sm text-gray-500">{city.province}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge className={`text-xs ${city.trigger_city ? 'bg-blue-600' : 'bg-gray-600'} border-gray-600`}>
                            {city.trigger_city ? 'Trigger City' : 'Regular'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Songwriters Results */}
            <TabsContent value="songwriters">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.songwriters?.map((songwriter) => (
                  <Card key={songwriter.doc_id} className="glass border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        {songwriter.image_url && (
                          <OptimizedImage
                            src={songwriter.image_url}
                            alt={songwriter.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover"
                            fallback="user"
                          />
                        )}
                        <div>
                          <h4 className="font-medium">{songwriter.name}</h4>
                          {songwriter.artistName && songwriter.artistName !== songwriter.name && (
                            <p className="text-sm text-gray-400">Artist: {songwriter.artistName}</p>
                          )}
                          <Badge className="text-xs mt-1 border-gray-600">
                            ID: {songwriter.doc_id}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Track Details Modal */}
        {selectedTrack && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <Card className="glass border-gray-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-start space-x-4">
                  {selectedTrack.image_url && (
                    <OptimizedImage
                      src={selectedTrack.image_url}
                      alt={selectedTrack.name}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded object-cover"
                      fallback="music"
                    />
                  )}
                  <div>
                    <CardTitle className="text-2xl">{selectedTrack.name}</CardTitle>
                    <p className="text-blue-400 text-lg">
                      {selectedTrack.artists?.map(a => a.name).join(', ')}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedTrack(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Track Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">ISRC:</span>
                        <span>{selectedTrack.isrc || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Duration:</span>
                        <span>{Math.floor(selectedTrack.duration_ms / 60000)}:{((selectedTrack.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Explicit:</span>
                        <span>{selectedTrack.explicit ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Release Date:</span>
                        <span>{'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Statistics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Spotify Popularity:</span>
                        <span className="text-green-400">{selectedTrack.cm_statistics?.sp_popularity || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Spotify Streams:</span>
                        <span className="text-green-400">{formatNumber(selectedTrack.cm_statistics?.sp_streams) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">YouTube Views:</span>
                        <span className="text-red-400">{formatNumber(selectedTrack.cm_statistics?.youtube_views) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">TikTok Count:</span>
                        <span className="text-pink-400">{formatNumber(selectedTrack.cm_statistics?.tiktok_counts) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Shazam Count:</span>
                        <span className="text-blue-400">{formatNumber(selectedTrack.cm_statistics?.shazam_counts) || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Playlist Stats */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Playlist Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 bg-gray-800/30 rounded">
                      <div className="text-2xl font-bold text-green-400">
                        {formatNumber(selectedTrack.cm_statistics?.num_sp_playlists)}
                      </div>
                      <div className="text-gray-400">Spotify Playlists</div>
                    </div>
                    <div className="text-center p-3 bg-gray-800/30 rounded">
                      <div className="text-2xl font-bold text-green-400">
                        {formatNumber(selectedTrack.cm_statistics?.num_sp_editorial_playlists)}
                      </div>
                      <div className="text-gray-400">Spotify Editorial</div>
                    </div>
                    <div className="text-center p-3 bg-gray-800/30 rounded">
                      <div className="text-2xl font-bold text-blue-400">
                        {formatNumber(selectedTrack.cm_statistics?.num_sp_playlists)}
                      </div>
                      <div className="text-gray-400">Apple Music</div>
                    </div>
                    <div className="text-center p-3 bg-gray-800/30 rounded">
                      <div className="text-2xl font-bold text-purple-400">
                        {formatNumber(selectedTrack.cm_statistics?.num_sp_editorial_playlists)}
                      </div>
                      <div className="text-gray-400">Deezer</div>
                    </div>
                  </div>
                </div>

                {/* Albums */}
                {selectedTrack.albums && selectedTrack.albums.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Albums</h3>
                    <div className="space-y-3">
                      {selectedTrack.albums.map((album) => (
                        <div key={album.id} className="flex items-center space-x-4 p-3 bg-gray-800/30 rounded">
                          {album.image_url && (
                            <OptimizedImage
                              src={album.image_url}
                              alt={album.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded object-cover"
                              fallback="music"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{album.name}</h4>
                            <p className="text-sm text-gray-400">{album.label}</p>
                            <p className="text-sm text-gray-400">Released: {formatDate(album.release_date)}</p>
                            {album.upc && (
                              <p className="text-xs text-gray-500">UPC: {album.upc}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Genres */}
                {selectedTrack.tags && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedTrack.tags.split(',').map((tag, index) => (
                        <Badge key={index} className="text-xs bg-gray-100 text-gray-800 border-gray-300">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading overlay for track details */}
        {trackDetailsLoading && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="text-white text-xl">Loading track details...</div>
          </div>
        )}
      </div>
    </div>
  )
}
