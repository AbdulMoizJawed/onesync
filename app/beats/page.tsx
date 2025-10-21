'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Breadcrumb } from '@/components/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CustomLoader from '@/components/ui/custom-loader'
import {
  Search,
  Filter,
  Play,
  Pause,
  Download,
  Heart,
  Share2,
  TrendingUp,
  Clock,
  User,
  Music,
  Headphones,
  Zap,
  Flame,
  Award,
  Volume2,
  Star,
  Users
} from 'lucide-react'
import Image from 'next/image'

interface Beat {
  id: string
  title: string
  producer: {
    id: string
    username: string
    displayName: string
    avatar: string
  }
  genre: string
  bpm: number
  key: string
  price: {
    basic: number
    premium: number
    unlimited: number
    exclusive?: number
  }
  likes: number
  plays: number
  duration: string
  tags: string[]
  audioUrl: string
  artworkUrl: string
  uploadDate: string
  description?: string
  featured?: boolean
}

interface Producer {
  id: string
  username: string
  displayName: string
  avatar: string
  beats: number
  followers: number
  verified: boolean
  bio?: string
}

export default function BeatMarketplace() {
  const { user, loading: authLoading } = useAuth()
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [featuredBeats, setFeaturedBeats] = useState<Beat[]>([])
  const [topProducers, setTopProducers] = useState<Producer[]>([])
  const [genres, setGenres] = useState<string[]>(['All'])
  const [loading, setLoading] = useState(true)
  const [searchResults, setSearchResults] = useState<Beat[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        
        // Load featured beats
        const featuredResponse = await fetch('/api/beats?action=featured&limit=8')
        if (featuredResponse.ok) {
          const featuredData = await featuredResponse.json()
          setFeaturedBeats(featuredData.beats || [])
        }

        // Load top producers
        const producersResponse = await fetch('/api/beats?action=producers&limit=4')
        if (producersResponse.ok) {
          const producersData = await producersResponse.json()
          setTopProducers(producersData.producers || [])
        }

        // Load genres
        const genresResponse = await fetch('/api/beats?action=genres')
        if (genresResponse.ok) {
          const genresData = await genresResponse.json()
          setGenres(genresData.genres || ['All'])
        }

      } catch (error) {
        console.error('Error loading initial data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadInitialData()
    }
  }, [user])

  // Search functionality
  useEffect(() => {
    const searchBeats = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      try {
        setIsSearching(true)
        const params = new URLSearchParams({
          action: 'search',
          q: searchTerm,
          limit: '12'
        })

        if (selectedGenre !== 'All') {
          params.append('genre', selectedGenre)
        }

        const response = await fetch(`/api/beats?${params}`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data.beats || [])
        }
      } catch (error) {
        console.error('Error searching beats:', error)
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(searchBeats, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, selectedGenre])

  const handleLikeBeat = async (beatId: string) => {
    try {
      const response = await fetch('/api/beats?action=like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ beatId }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update local state to reflect like status
        // This could be improved with proper state management
        console.log(`Beat ${beatId} ${data.liked ? 'liked' : 'unliked'}`)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleFollowProducer = async (producerId: string) => {
    try {
      const response = await fetch('/api/beats?action=follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ producerId }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update local state to reflect follow status
        console.log(`Producer ${producerId} ${data.following ? 'followed' : 'unfollowed'}`)
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <CustomLoader size="lg" showText text="Loading beat marketplace..." />
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-400">Please log in to access the beat marketplace</p>
        </div>
      </div>
    )
  }

  const displayBeats = searchTerm.trim() ? searchResults : featuredBeats

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950">
          {/* Breadcrumb */}
          <div className="border-b border-gray-800 bg-gray-950">
            <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
              <Breadcrumb 
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Beat Marketplace', href: '/beats' }
                ]} 
              />
            </div>
          </div>

          {/* Hero Section */}
          <div className="relative bg-gray-900 py-16">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative container mx-auto px-4">
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
                  Premium Beat Marketplace
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 sm:mb-8">
                  Discover high-quality beats from top producers worldwide
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search beats, producers, genres..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3">
                    <Volume2 className="w-4 h-4 mr-2" />
                    Explore Beats
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-gray-300 mb-1">{featuredBeats.length}+</div>
                <div className="text-gray-400 text-sm">Premium Beats</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-gray-300 mb-1">{topProducers.length}+</div>
                <div className="text-gray-400 text-sm">Verified Producers</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-gray-300 mb-1">1K+</div>
                <div className="text-gray-400 text-sm">Happy Artists</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-gray-300 mb-1">24/7</div>
                <div className="text-gray-400 text-sm">Instant Access</div>
              </div>
            </div>

            {/* Genre Filters */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Filter className="w-6 h-6 text-purple-400" />
                Browse by Genre
              </h2>
              <div className="flex flex-wrap gap-3">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-6 py-2 rounded-full transition-all ${
                      selectedGenre === genre
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Results or Featured Beats */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                {searchTerm.trim() ? (
                  <>
                    <Search className="w-6 h-6 text-blue-400" />
                    Search Results {isSearching && '(Loading...)'}
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6 text-yellow-400" />
                    Featured Beats
                  </>
                )}
              </h2>
              
              {displayBeats.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    {searchTerm.trim() ? 'No beats found matching your search.' : 'No beats available yet.'}
                  </p>
                  {searchTerm.trim() && (
                    <p className="text-gray-500 text-sm mt-2">
                      Try adjusting your search terms or browse by genre.
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayBeats.map((beat) => (
                    <Card key={beat.id} className="bg-gray-900 border-gray-800 hover:border-purple-500 transition-all hover:scale-105 group">
                      <CardContent className="p-6">
                        {/* Beat Cover & Play Button */}
                        <div className="relative mb-4">
                          <div className="w-full h-48 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                            {beat.artworkUrl && beat.artworkUrl !== '/api/placeholder/300/300' ? (
                              <Image 
                                src={beat.artworkUrl} 
                                alt={beat.title}
                                className="w-full h-full object-cover"
                                width={300}
                                height={192}
                              />
                            ) : (
                              <div 
                                className="w-full h-full flex items-center justify-center"
                                style={{
                                  background: `linear-gradient(45deg, 
                                    hsl(${(beat.id.charCodeAt(0) * 137.508) % 360}, 70%, 50%), 
                                    hsl(${(beat.id.charCodeAt(1) * 137.508) % 360}, 70%, 60%))`
                                }}
                              >
                                <span className="text-white font-bold text-2xl">
                                  {beat.producer.displayName.charAt(0)}
                                </span>
                              </div>
                            )}
                            <button
                              onClick={() => setCurrentlyPlaying(currentlyPlaying === beat.id ? null : beat.id)}
                              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {currentlyPlaying === beat.id ? (
                                <Pause className="w-12 h-12 text-white" />
                              ) : (
                                <Play className="w-12 h-12 text-white" />
                              )}
                            </button>
                            {beat.featured && (
                              <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                                FEATURED
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Beat Info */}
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-bold text-white text-lg">{beat.title}</h3>
                            <p className="text-gray-400 text-sm flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              {beat.producer.displayName}
                            </p>
                          </div>

                          {/* Tags */}
                          {beat.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {beat.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Beat Details */}
                          <div className="flex justify-between text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {beat.duration}
                            </span>
                            <span>{beat.bpm} BPM</span>
                            <span className="flex items-center gap-1">
                              <Headphones className="w-3 h-3" />
                              {beat.plays.toLocaleString()}
                            </span>
                          </div>

                          {/* Price & Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                            <span className="text-2xl font-bold text-white">
                              ${beat.price.basic}
                            </span>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-gray-700 text-gray-300 hover:text-white"
                                onClick={() => handleLikeBeat(beat.id)}
                              >
                                <Heart className="w-4 h-4" />
                              </Button>
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Top Producers */}
            {topProducers.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-400" />
                  Top Producers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {topProducers.map((producer) => (
                    <Card key={producer.id} className="bg-gray-900 border-gray-800 hover:border-purple-500 transition-all">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                          {producer.avatar && producer.avatar !== '/api/placeholder/50/50' ? (
                            <Image 
                              src={producer.avatar} 
                              alt={producer.displayName}
                              className="w-full h-full object-cover"
                              width={64}
                              height={64}
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center"
                              style={{
                                background: `linear-gradient(45deg, 
                                  hsl(${(producer.id.charCodeAt(0) * 137.508) % 360}, 70%, 50%), 
                                  hsl(${(producer.id.charCodeAt(1) * 137.508) % 360}, 70%, 60%))`
                              }}
                            >
                              <span className="text-white font-bold text-xl">
                                {producer.displayName.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-white mb-1 flex items-center justify-center gap-1">
                          {producer.displayName}
                          {producer.verified && <Award className="w-4 h-4 text-blue-400" />}
                        </h3>
                        <div className="text-sm text-gray-400 space-y-1">
                          <div>{producer.beats} beats</div>
                          <div className="flex items-center justify-center gap-1">
                            <Users className="w-3 h-3" />
                            {producer.followers} followers
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="mt-4 bg-purple-600 hover:bg-purple-700 w-full"
                          onClick={() => handleFollowProducer(producer.id)}
                        >
                          Follow
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
