"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, ExternalLink, Music, Users, Award, ChevronRight, ArrowLeft, Calendar, Star } from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"
import { animations } from "@/lib/animations"
import { debounce, measureAsync } from "@/lib/performance"
import { OptimizedImage, ArtistImage } from "@/components/optimized-image"
import type { MusoProfile, MusoCredit, MusoCollaborator } from "@/lib/muso-api"

interface MusoArtistData {
  profile: MusoProfile;
  credits: { items: MusoCredit[]; totalCount: number };
  collaborators: { items: MusoCollaborator[]; totalCount: number };
}

export function MusoArtistSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<MusoProfile[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<MusoArtistData | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [lastSearchTime, setLastSearchTime] = useState(0);

  // Refs for cleanup and cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;

    // Rate limiting: prevent searches more frequent than every 1 second
    const now = Date.now();
    const timeSinceLastSearch = now - lastSearchTime;
    if (timeSinceLastSearch < 1000 && searching) {
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setSearching(true);
    setError("");
    setLastSearchTime(now);

    try {
      const response = await measureAsync(
        () => fetch(`/api/search/muso?q=${encodeURIComponent(searchTerm)}&type=profile`, { signal }),
        'muso-search'
      );

      // Check if request was aborted
      if (signal.aborted) return;

      const payload = await response.json();

      if (response.ok && payload?.success) {
        const profiles =
          payload?.data?.data?.profiles?.items ||
          payload?.data?.profiles?.items ||
          payload?.profiles?.items ||
          [];
        setSearchResults(profiles);
        setShowResults(true);
        if (profiles.length === 0) {
          setError('No artists found for this search');
        }
      } else {
        const errorMsg = payload?.error || `API Error: ${response.status} ${response.statusText}`;
        if (response.status === 403) {
          setError('API access denied. Please check your API key configuration.');
        } else if (response.status === 429) {
          setError('Rate limit exceeded. Please wait a moment and try again.');
        } else {
          setError(errorMsg);
        }
      }
    } catch (err: any) {
      // Don't show error for aborted requests
      if (err.name === 'AbortError' || signal.aborted) return;

      setError('Network error occurred');
      console.error('Search error:', err);
    } finally {
      if (!signal.aborted) {
        setSearching(false);
      }
    }
  }, [searchTerm, lastSearchTime, searching])

  const handleSelectArtist = useCallback(async (profile: MusoProfile) => {
    // Prevent multiple simultaneous artist selections
    if (loading) return

    setLoading(true)
    setError("")
    setShowResults(false) // Hide search results and show selected artist with swipe animation

    try {
      const response = await fetch(`/api/artist/muso?id=${profile.id}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setSelectedArtist(data.data)
      } else {
        const errorMsg = data.error || `API Error: ${response.status} ${response.statusText}`
        if (response.status === 403) {
          setError('API access denied for artist details.')
        } else if (response.status === 429) {
          setError('Rate limit exceeded. Please wait before fetching more details.')
        } else {
          setError(errorMsg)
        }
        // Don't immediately show results on rate limit errors to prevent thrashing
        if (response.status !== 429) {
          setShowResults(true)
        } else {
          // Show results after a delay for rate limits
          setTimeout(() => setShowResults(true), 2000)
        }
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Artist fetch error:', err)
      setShowResults(true) // Show results again on error
    } finally {
      setLoading(false)
    }
  }, [loading])

  const handleBackToResults = () => {
    setSelectedArtist(null)
    setShowResults(true)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Debounced search for better performance - now stable since handleSearch is memoized
  const debouncedSearch = useCallback(debounce(handleSearch, 1000), [handleSearch])

  // Auto-search when typing (debounced) - increased minimum length to reduce API calls
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Only auto-search for longer terms to reduce API calls
    if (searchTerm.trim().length > 3) {
      searchTimeoutRef.current = setTimeout(() => {
        debouncedSearch()
      }, 1500) // Longer delay for auto-search
    } else {
      // Clear results if search term is too short
      setSearchResults([])
      setShowResults(false)
      setError("")
    }

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm, debouncedSearch])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <Card className="card-dark">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Music className="w-5 h-5" />
            Muso.AI Artist Search
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Search for artists and explore their credits, collaborators, and industry data. Auto-search starts after 4+ characters.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for artists... (minimum 4 characters)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 input-dark"
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={searching || !searchTerm.trim()}
              className="button-primary"
            >
              {searching ? <CustomLoader size="sm" /> : "Search"}
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-950/50 border border-red-800 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Area with Swipe Navigation */}
      <div className="relative overflow-hidden">
        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <div className={`${animations.swipeInLeft}`}>
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Search Results ({searchResults.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {searchResults.map((profile) => (
                    <Card 
                      key={profile.id} 
                      className="card-dark hover:bg-gray-800/50 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                      onClick={() => handleSelectArtist(profile)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <ArtistImage
                            src={profile.avatarUrl}
                            alt={profile.name}
                            size="md"
                            className="w-16 h-16 rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-lg">{profile.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs bg-purple-600/20 text-purple-300">
                                {profile.type}
                              </Badge>
                              <span className="text-gray-400 text-sm">
                                {profile.creditCount} credits
                              </span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-400 text-sm">
                                {profile.collaboratorsCount} collaborators
                              </span>
                            </div>
                            {profile.city && profile.country && (
                              <div className="text-gray-500 text-sm mt-1">
                                📍 {profile.city}, {profile.country}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-yellow-400 font-medium">
                              <Star className="w-4 h-4" />
                              {profile.popularity}
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 mt-2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <Card className={`card-dark ${animations.dissolveIn}`}>
            <CardContent className="p-8 text-center">
              <CustomLoader size="lg" showText text="Loading artist data..." />
            </CardContent>
          </Card>
        )}

        {/* Selected Artist Details */}
        {selectedArtist && (
          <div className={`${animations.swipeInRight}`}>
            <Card className="card-dark">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={handleBackToResults}
                    className="text-gray-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Results
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <ArtistImage
                    src={selectedArtist.profile.avatarUrl}
                    alt={selectedArtist.profile.name}
                    size="lg"
                    className="w-20 h-20 rounded-xl"
                  />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">{selectedArtist.profile.name}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge className="bg-blue-600">{selectedArtist.profile.type}</Badge>
                      {selectedArtist.profile.city && selectedArtist.profile.country && (
                        <span className="text-gray-400">
                          📍 {selectedArtist.profile.city}, {selectedArtist.profile.country}
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-yellow-400 font-medium">
                        <Star className="w-4 h-4" />
                        {selectedArtist.profile.popularity}
                      </div>
                    </div>
                  </div>
                  {selectedArtist.profile.website && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedArtist.profile.website, '_blank')}
                      className="border-gray-700 text-white hover:bg-gray-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedArtist.profile.bio && (
                  <div className="mb-6">
                    <h3 className="text-white font-medium mb-2">Biography</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {selectedArtist.profile.bio}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-800/30 rounded-lg">
                    <Award className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{selectedArtist.credits.totalCount}</div>
                    <div className="text-gray-400 text-sm">Total Credits</div>
                  </div>
                  <div className="text-center p-4 bg-gray-800/30 rounded-lg">
                    <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{selectedArtist.collaborators.totalCount}</div>
                    <div className="text-gray-400 text-sm">Collaborators</div>
                  </div>
                  <div className="text-center p-4 bg-gray-800/30 rounded-lg">
                    <Music className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{selectedArtist.profile.popularity}</div>
                    <div className="text-gray-400 text-sm">Popularity Score</div>
                  </div>
                </div>

                <Tabs defaultValue="credits" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                    <TabsTrigger value="credits" className="data-[state=active]:bg-gray-700">
                      Credits ({selectedArtist.credits.items.length})
                    </TabsTrigger>
                    <TabsTrigger value="collaborators" className="data-[state=active]:bg-gray-700">
                      Collaborators ({selectedArtist.collaborators.items.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="credits" className="space-y-3 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedArtist.credits.items.map((credit) => (
                        <Card 
                          key={credit.id} 
                          className="bg-gray-800/30 hover:bg-gray-800/50 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                          onClick={() => window.open(`https://muso.ai/search?keyword=${encodeURIComponent(credit.title)}`, '_blank')}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <Music className="w-6 h-6 text-gray-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium truncate">{credit.title}</h4>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 truncate">
                                  <span className="px-2 py-0.5 bg-purple-600/20 text-purple-300 rounded">
                                    {credit.role}
                                  </span>
                                  {credit.album && (
                                    <div className="flex items-center gap-1 truncate">
                                      <Calendar className="w-3 h-3" />
                                      <span>{credit.album.title} • {new Date(credit.album.releaseDate).getFullYear()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="flex items-center gap-1 text-yellow-400 font-medium">
                                  <Star className="w-3 h-3" />
                                  {credit.popularity}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="collaborators" className="space-y-3 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedArtist.collaborators.items.map((collaborator) => (
                        <Card key={collaborator.id} className="bg-gray-800/30 hover:bg-gray-800/50 cursor-pointer transition-all duration-200">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <ArtistImage
                                src={collaborator.avatarUrl}
                                alt={collaborator.name}
                                size="sm"
                                className="w-12 h-12 rounded-lg"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium truncate">{collaborator.name}</h4>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                  <Badge variant="secondary" className="text-xs bg-blue-600/20 text-blue-300">
                                    Collaborator
                                  </Badge>
                                  <span>★ {collaborator.popularity}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
