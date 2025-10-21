'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Search, Music, BarChart3, Info, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { combinedMusicApi } from '@/lib/combined-music-api'
import { getApiStatus } from '@/lib/env-config'

export default function SpotOnTrackSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'artist' | 'track'>('artist')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const apiStatus = getApiStatus()
  const hasRealApiKey = apiStatus.spotontrack

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    setHasSearched(true)
    try {
      let results: any[] = []
      if (searchType === 'artist') {
        results = await combinedMusicApi.searchArtists(searchQuery, 10)
      } else {
        results = await combinedMusicApi.searchTracks(searchQuery, 10)
      }
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
          <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
          Music Industry Search
          {!hasRealApiKey && (
            <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-500/30 text-xs">
              Demo Mode
            </Badge>
          )}
        </CardTitle>
        {!hasRealApiKey && (
          <div className="flex items-center gap-2 text-sm text-yellow-300">
            <Info className="w-4 h-4" />
            Real API key needed for full functionality
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Search Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="search" className="text-gray-300 text-sm mb-2 block">
              Search Query
            </Label>
            <Input
              id="search"
              type="text"
              placeholder={searchType === "artist" ? "Enter artist name..." : "Enter track name..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-800/50 border-gray-600 text-white h-10 sm:h-auto"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <Label className="text-gray-300 text-sm mb-2 block">Search Type</Label>
            <Select value={searchType} onValueChange={(value: string) => setSearchType(value as "artist" | "track")}>
              <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white h-10 sm:h-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="artist">Artist</SelectItem>
                <SelectItem value="track">Track</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-11 sm:h-auto"
        >
          {isSearching ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Search
            </>
          )}
        </Button>

        {/* Results */}
        {hasSearched && searchResults.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-white font-semibold text-base sm:text-lg">Search Results</h3>
            <div className="grid gap-3 sm:gap-4">
              {searchResults.map((track, index) => (
                <Card key={track.id || index} className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      {track.album?.images?.[0] && (
                        <Image
                          src={track.album.images[0].url}
                          alt={track.album.name}
                          width={64}
                          height={64}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                          unoptimized
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold text-sm sm:text-base line-clamp-1">
                          {track.name}
                        </h4>
                        <p className="text-gray-400 text-xs sm:text-sm">
                          {track.artists?.map((a: any) => a.name).join(', ')} • {track.album?.name}
                        </p>
                        
                        {track.enhanced && track.spotontrack_data && (
                          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className="bg-gray-700/50 p-2 rounded">
                              <div className="text-gray-400">Total Streams</div>
                              <div className="text-green-400 font-semibold">
                                {track.spotontrack_data.streams?.total?.toLocaleString() || 'N/A'}
                              </div>
                            </div>
                            <div className="bg-gray-700/50 p-2 rounded">
                              <div className="text-gray-400">Playlists</div>
                              <div className="text-blue-400 font-semibold">
                                {track.spotontrack_data.playlists?.total || 'N/A'}
                              </div>
                            </div>
                            <div className="bg-gray-700/50 p-2 rounded">
                              <div className="text-gray-400">Popularity</div>
                              <div className="text-purple-400 font-semibold">
                                {track.spotontrack_data.marketData?.popularity || track.popularity || 'N/A'}%
                              </div>
                            </div>
                            <div className="bg-gray-700/50 p-2 rounded">
                              <div className="text-gray-400">Virality</div>
                              <div className="text-pink-400 font-semibold">
                                {track.spotontrack_data.marketData?.virality_score || 'N/A'}%
                              </div>
                            </div>
                          </div>
                        )}

                        {track.enhanced ? (
                          <Badge className="mt-2 bg-green-600/20 text-green-300 border-green-500/30 text-xs">
                            Enhanced with Industry Data
                          </Badge>
                        ) : (
                          <Badge className="mt-2 bg-gray-600/20 text-gray-300 border-gray-500/30 text-xs">
                            Basic Data Only
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {hasSearched && searchResults.length === 0 && !isSearching && (
          <div className="text-center py-6 sm:py-8">
            <Music className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No Results Found</h3>
            <p className="text-gray-400 text-sm sm:text-base">
              Try searching for a different {searchType} or check your spelling.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
