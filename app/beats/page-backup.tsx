'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/auth'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Breadcrumb } from '@/components/breadcrumb'
import CustomLoader from '@/components/ui/custom-loader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Play, Heart, Star, Grid3X3, List, Upload, Plus, Pause, Download, Share2, Eye, Clock, Zap, Crown, Users, TrendingUp, Filter, SortDesc, ChevronDown, Volume2, SkipBack, SkipForward, Repeat, Shuffle, Music, ShoppingCart, X, Trash2 } from 'lucide-react'

// Lazy load WaveSurfer player to avoid SSR issues
const WaveSurferPlayer = dynamic(() => import('@/components/wavesurfer-player'), { 
  ssr: false,
  loading: () => <div className="h-20 bg-gray-800 animate-pulse" />
})

// Debounce hook for search optimization
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface Beat {
  id: string
  title: string
  producer: {
    id: string
    username: string
    displayName: string
    avatar: string
    verified: boolean
    tier: 'free' | 'pro' | 'unlimited' // BeatStars has tier system
  }
  price: {
    basic: number // MP3 Lease
    premium: number // WAV Lease  
    unlimited: number // Unlimited Lease
    exclusive: number // Exclusive Rights
  }
  duration: number
  bpm: number
  key: string
  genre: string
  mood: string[]
  tags: string[]
  audioUrl: string
  artworkUrl: string
  plays: number
  likes: number
  downloads: number
  isFeatured: boolean
  isPromoted: boolean // BeatStars Promote feature
  createdAt: string
  license: {
    basic: {
      name: 'MP3 Lease'
      price: number
      description: 'Non-exclusive rights, MP3 format'
      streams: number // 10,000 streams
      sales: number // 2,000 sales
    }
    premium: {
      name: 'WAV Lease'
      price: number
      description: 'Non-exclusive rights, WAV format'
      streams: number // 100,000 streams
      sales: number // 10,000 sales
    }
    unlimited: {
      name: 'Unlimited Lease'
      price: number
      description: 'Non-exclusive rights, unlimited use'
      streams: number // Unlimited
      sales: number // Unlimited
    }
    exclusive: {
      name: 'Exclusive Rights'
      price: number
      description: 'Full exclusive ownership'
      streams: number // Unlimited
      sales: number // Unlimited
    }
  }
  waveform?: string // Waveform data for audio visualization
  stem_files?: boolean // Track stems available
  collaboration?: {
    open: boolean
    splits: { producer: number; collaborator: number }
  }
}

export default function BeatMarketplace() {
  const { user, loading: authLoading } = useAuth()
  const [beats, setBeats] = useState<Beat[]>([])
  const [featuredBeats, setFeaturedBeats] = useState<Beat[]>([])
  const [trendingBeats, setTrendingBeats] = useState<Beat[]>([])
  const [promotedBeats, setPromotedBeats] = useState<Beat[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table') // Start with table view
  const [isMobile, setIsMobile] = useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showLicenseModal, setShowLicenseModal] = useState<string | null>(null)
  const [showCartModal, setShowCartModal] = useState(false)
  const [cartMinimized, setCartMinimized] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [notifications, setNotifications] = useState<{id: string, type: 'success' | 'info' | 'warning', message: string, timestamp: Date}[]>([])
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [selectedMood, setSelectedMood] = useState<string>('all')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'trending' | 'price_low' | 'price_high'>('newest')
  const [showFilters, setShowFilters] = useState(false)
  
  // Persistent state with localStorage
  const [likedBeats, setLikedBeats] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('musicapp_liked_beats')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    }
    return new Set()
  })
  
  const [cartItems, setCartItems] = useState<{beatId: string, license: string, price: number, beatTitle: string, producer: string}[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('musicapp_cart')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [showPlayer, setShowPlayer] = useState(false)

  // Persist likes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('musicapp_liked_beats', JSON.stringify([...likedBeats]))
    }
  }, [likedBeats])

  // Persist cart to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('musicapp_cart', JSON.stringify(cartItems))
    }
  }, [cartItems])

  // Notification system
  const addNotification = useCallback((type: 'success' | 'info' | 'warning', message: string) => {
    const id = Date.now().toString()
    const notification = {
      id,
      type,
      message,
      timestamp: new Date()
    }
    setNotifications(prev => [...prev, notification])
    
    // Auto-remove notification after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3000)
  }, [])

  // Cart management functions
  const addToCart = useCallback((beatId: string, license: string, price: number, beatTitle: string, producer: string) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.beatId === beatId && item.license === license)
      if (existingIndex >= 0) {
        // Item already in cart, don't add duplicate
        addNotification('warning', 'Item already in cart!')
        return prev
      }
      addNotification('success', `"${beatTitle}" (${license.toUpperCase()}) added to cart - $${price}`)
      
      // Show cart if minimized when adding new item
      setCartMinimized(false)
      
      // Trigger dissolve effect
      setIsAddingToCart(true)
      
      // Close license modal with dissolve effect delay
      setTimeout(() => {
        setShowLicenseModal(null)
        setIsAddingToCart(false)
      }, 400)
      
      return [...prev, { beatId, license, price, beatTitle, producer }]
    })
  }, [addNotification])

  const removeFromCart = useCallback((beatId: string, license: string) => {
    setCartItems(prev => {
      const item = prev.find(item => item.beatId === beatId && item.license === license)
      if (item) {
        addNotification('info', `"${item.beatTitle}" removed from cart`)
      }
      return prev.filter(item => !(item.beatId === beatId && item.license === license))
    })
  }, [addNotification])

  const clearCart = useCallback(() => {
    if (cartItems.length > 0) {
      addNotification('info', 'Cart cleared')
    }
    setCartItems([])
  }, [addNotification, cartItems.length])

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.price, 0)
  }, [cartItems])

  const getCartItemCount = useCallback(() => {
    return cartItems.length
  }, [cartItems])

  // Likes management functions
  const toggleLike = useCallback((beatId: string) => {
    setLikedBeats(prev => {
      const newLikedBeats = new Set(prev)
      const wasLiked = newLikedBeats.has(beatId)
      if (wasLiked) {
        newLikedBeats.delete(beatId)
        addNotification('info', 'Beat removed from favorites')
      } else {
        newLikedBeats.add(beatId)
        addNotification('success', 'Beat added to favorites!')
      }
      return newLikedBeats
    })
  }, [addNotification])

  // BeatStars-style genres
  const genres = [
    'all', 'trap', 'hip-hop', 'drill', 'r&b', 'pop', 'afrobeat', 'reggaeton', 
    'electronic', 'house', 'techno', 'dubstep', 'future-bass', 'lo-fi', 'jazz', 
    'rock', 'country', 'latin', 'world', 'experimental'
  ]

  // BeatStars-style moods
  const moods = [
    'all', 'dark', 'aggressive', 'melodic', 'chill', 'uplifting', 'emotional', 
    'hard', 'bouncy', 'atmospheric', 'epic', 'minimal', 'heavy', 'smooth'
  ]

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Check if mobile on mount - memoized
  const checkMobile = useCallback(() => {
    const mobile = window.innerWidth < 768
    setIsMobile(mobile)
    // Keep table view as default regardless of screen size
  }, [])

  useEffect(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [checkMobile])

  // Memoized filtered beats
  const filteredBeats = useMemo(() => {
    if (!debouncedSearchQuery) return beats
    return beats.filter(beat => 
      beat.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      beat.producer.displayName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      beat.genre.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    )
  }, [beats, debouncedSearchQuery])

  const filteredFeaturedBeats = useMemo(() => {
    if (!debouncedSearchQuery) return featuredBeats
    return featuredBeats.filter(beat => 
      beat.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      beat.producer.displayName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      beat.genre.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    )
  }, [featuredBeats, debouncedSearchQuery])

  const filteredTrendingBeats = useMemo(() => {
    if (!debouncedSearchQuery) return trendingBeats
    return trendingBeats.filter(beat => 
      beat.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      beat.producer.displayName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      beat.genre.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    )
  }, [trendingBeats, debouncedSearchQuery])

  // Load beats data - memoized
  const loadBeats = useCallback(async () => {
    try {
      setLoading(true)
      
      // Mock data for demonstration with proper audio URLs
      const mockBeats: Beat[] = [
        {
          id: '1',
          title: 'Dark Trap Symphony',
          producer: {
            id: 'prod1',
            username: 'beatmaker808',
            displayName: 'BeatMaker808',
            avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop&crop=face',
            verified: true,
            tier: 'pro'
          },
          price: {
            basic: 29,
            premium: 49,
            unlimited: 99,
            exclusive: 299
          },
          duration: 180,
          bpm: 140,
          key: 'C Minor',
          genre: 'trap',
          mood: ['dark', 'aggressive'],
          tags: ['808', 'hard', 'dark'],
          audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Demo audio
          artworkUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
          plays: 15420,
          likes: 892,
          downloads: 234,
          isFeatured: true,
          isPromoted: false,
          createdAt: '2024-01-15',
          license: {
            basic: {
              name: 'MP3 Lease',
              price: 29,
              description: 'Non-exclusive rights, MP3 format',
              streams: 10000,
              sales: 2000
            },
            premium: {
              name: 'WAV Lease',
              price: 49,
              description: 'Non-exclusive rights, WAV format',
              streams: 100000,
              sales: 10000
            },
            unlimited: {
              name: 'Unlimited Lease',
              price: 99,
              description: 'Non-exclusive rights, unlimited use',
              streams: -1,
              sales: -1
            },
            exclusive: {
              name: 'Exclusive Rights',
              price: 299,
              description: 'Full exclusive ownership',
              streams: -1,
              sales: -1
            }
          }
        },
        {
          id: '2',
          title: 'Melodic Dreams',
          producer: {
            id: 'prod2',
            username: 'melodicpro',
            displayName: 'MelodicPro',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
            verified: false,
            tier: 'free'
          },
          price: {
            basic: 19,
            premium: 39,
            unlimited: 79,
            exclusive: 199
          },
          duration: 200,
          bpm: 120,
          key: 'G Major',
          genre: 'r&b',
          mood: ['melodic', 'chill'],
          tags: ['smooth', 'vocals', 'emotional'],
          audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Demo audio
          artworkUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
          plays: 8750,
          likes: 445,
          downloads: 123,
          isFeatured: false,
          isPromoted: true,
          createdAt: '2024-01-12',
          license: {
            basic: {
              name: 'MP3 Lease',
              price: 19,
              description: 'Non-exclusive rights, MP3 format',
              streams: 10000,
              sales: 2000
            },
            premium: {
              name: 'WAV Lease',
              price: 39,
              description: 'Non-exclusive rights, WAV format',
              streams: 100000,
              sales: 10000
            },
            unlimited: {
              name: 'Unlimited Lease',
              price: 79,
              description: 'Non-exclusive rights, unlimited use',
              streams: -1,
              sales: -1
            },
            exclusive: {
              name: 'Exclusive Rights',
              price: 199,
              description: 'Full exclusive ownership',
              streams: -1,
              sales: -1
            }
          }
        }
      ]

      setBeats(mockBeats)
      setFeaturedBeats([mockBeats[0]])
      setTrendingBeats([mockBeats[1]])
    } catch (error) {
      console.error('Error loading beats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load beats data
  useEffect(() => {
    if (user) {
      loadBeats()
    }
  }, [user, loadBeats])

  const togglePlay = (beatId: string) => {
    const beat = [...beats, ...featuredBeats, ...trendingBeats].find(b => b.id === beatId)
    if (!beat) return

    if (currentlyPlaying === beatId) {
      setCurrentlyPlaying(null)
      setCurrentBeat(null)
    } else {
      setCurrentlyPlaying(beatId)
      setCurrentBeat(beat)
    }
  }

  // Get next/previous beat for player
  const getNextBeat = useCallback(() => {
    if (!currentBeat) return
    const allBeats = [...beats, ...featuredBeats, ...trendingBeats]
    const currentIndex = allBeats.findIndex(beat => beat.id === currentBeat.id)
    const nextIndex = (currentIndex + 1) % allBeats.length
    const nextBeat = allBeats[nextIndex]
    if (nextBeat) {
      setCurrentlyPlaying(nextBeat.id)
      setCurrentBeat(nextBeat)
    }
  }, [currentBeat, beats, featuredBeats, trendingBeats])

  const getPreviousBeat = useCallback(() => {
    if (!currentBeat) return
    const allBeats = [...beats, ...featuredBeats, ...trendingBeats]
    const currentIndex = allBeats.findIndex(beat => beat.id === currentBeat.id)
    const prevIndex = currentIndex <= 0 ? allBeats.length - 1 : currentIndex - 1
    const prevBeat = allBeats[prevIndex]
    if (prevBeat) {
      setCurrentlyPlaying(prevBeat.id)
      setCurrentBeat(prevBeat)
    }
  }, [currentBeat, beats, featuredBeats, trendingBeats])

  // Get currently playing beat data
  const getCurrentBeat = () => {
    if (!currentlyPlaying) return null
    return [...beats, ...featuredBeats, ...trendingBeats].find(beat => beat.id === currentlyPlaying)
  }

  // Enhanced Beat Card Component - BeatStars style
  const BeatCard = React.memo(({ beat }: { beat: Beat }) => {
    const isLiked = likedBeats.has(beat.id)
    
    const toggleLike = (e: React.MouseEvent) => {
      e.stopPropagation()
      const newLikedBeats = new Set(likedBeats)
      if (isLiked) {
        newLikedBeats.delete(beat.id)
      } else {
        newLikedBeats.add(beat.id)
      }
      setLikedBeats(newLikedBeats)
    }

    const handleAddToCart = (license: string, price: number) => {
      addToCart(beat.id, license, price, beat.title, beat.producer.displayName)
      // Show success toast here
    }

    return (
      <Card className="group hover:shadow-xl hover:border-primary/50 transition-all duration-300 bg-gray-900 border-gray-800 overflow-hidden h-full flex flex-col">
        {/* Artwork Section */}
        <div className="relative aspect-square w-full overflow-hidden bg-gray-800">
          <Image 
            src={beat.artworkUrl} 
            alt={beat.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={false}
          />
          
          {/* Overlay Icons */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300">
            {/* Top Row - Status badges */}
            <div className="absolute top-2 left-2 flex gap-1">
              {beat.isFeatured && (
                <Badge className="bg-yellow-600 text-white px-1 py-0.5 text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
              {beat.isPromoted && (
                <Badge className="bg-purple-600 text-white px-1 py-0.5 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Promoted
                </Badge>
              )}
              {beat.producer.tier === 'pro' && (
                <Badge className="bg-blue-600 text-white px-1 py-0.5 text-xs">
                  <Crown className="w-3 h-3" />
                </Badge>
              )}
            </div>

            {/* Top Right - Actions */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white"
                onClick={toggleLike}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Center Play Button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                onClick={() => togglePlay(beat.id)}
                className="h-12 w-12 rounded-full bg-primary hover:bg-primary/80 text-white p-0"
              >
                {currentlyPlaying === beat.id ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </Button>
            </div>

            {/* Bottom Stats */}
            <div className="absolute bottom-2 left-2 right-2 flex justify-between text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 bg-black/50 rounded px-2 py-1">
                <Eye className="w-3 h-3" />
                <span>{beat.plays.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 bg-black/50 rounded px-2 py-1">
                <Download className="w-3 h-3" />
                <span>{beat.downloads.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="p-3 space-y-3 flex-1 flex flex-col justify-between">
          {/* Title and Producer */}
          <div>
            <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-primary transition-colors">
              {beat.title}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-gray-400 text-xs">by</span>
              <span className="text-gray-300 text-xs font-medium hover:text-primary cursor-pointer">
                {beat.producer.displayName}
              </span>
              {beat.producer.verified && (
                <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px]">✓</span>
                </div>
              )}
            </div>
          </div>

          {/* Beat Info */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Music className="w-3 h-3" />
              <span>{beat.bpm} BPM</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{Math.floor(beat.duration / 60)}:{(beat.duration % 60).toString().padStart(2, '0')}</span>
            </div>
            <Badge variant="outline" className="text-xs px-1 py-0">
              {beat.key}
            </Badge>
          </div>

          {/* Genre and Tags */}
          <div className="space-y-1">
            <Badge variant="secondary" className="text-xs">
              {beat.genre}
            </Badge>
            <div className="flex flex-wrap gap-1">
              {beat.mood.slice(0, 2).map((mood) => (
                <Badge key={mood} variant="outline" className="text-xs px-1 py-0 text-gray-400">
                  {mood}
                </Badge>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">From</span>
              <span className="text-lg font-bold text-white">${beat.price.basic}</span>
            </div>
            
            {/* License Options */}
            <div className="grid grid-cols-2 gap-1">
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 border-gray-700 hover:border-primary"
                onClick={() => handleAddToCart('basic', beat.price.basic)}
              >
                MP3 ${beat.price.basic}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 border-gray-700 hover:border-primary"
                onClick={() => handleAddToCart('premium', beat.price.premium)}
              >
                WAV ${beat.price.premium}
              </Button>
            </div>
            
            <Button
              size="sm"
              className="w-full text-xs h-8 bg-primary hover:bg-primary/80"
              onClick={() => setShowLicenseModal(beat.id)}
            >
              View All Licenses
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  })

  // Table View Component - Mobile Optimized
  const BeatTableView = React.memo(({ beats }: { beats: Beat[] }) => (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800 border-b border-gray-700">
            <tr>
              <th className="text-left p-3 text-gray-300 font-medium">Track</th>
              <th className="text-left p-3 text-gray-300 font-medium">Producer</th>
              <th className="text-left p-3 text-gray-300 font-medium">Genre</th>
              <th className="text-left p-3 text-gray-300 font-medium">BPM</th>
              <th className="text-left p-3 text-gray-300 font-medium">Key</th>
              <th className="text-left p-3 text-gray-300 font-medium">Duration</th>
              <th className="text-left p-3 text-gray-300 font-medium">Price</th>
              <th className="text-left p-3 text-gray-300 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {beats.map((beat, index) => (
              <tr 
                key={beat.id} 
                className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
                  currentlyPlaying === beat.id ? 'bg-primary/10' : ''
                }`}
              >
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <Image 
                        src={beat.artworkUrl} 
                        alt={beat.title}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover"
                        priority={false}
                      />
                      <button
                        onClick={() => togglePlay(beat.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg"
                      >
                        {currentlyPlaying === beat.id && isPlaying ? (
                          <Pause className="w-4 h-4 text-white" />
                        ) : (
                          <Play className="w-4 h-4 text-white" />
                        )}
                      </button>
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">{beat.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {beat.isFeatured && <Star className="w-3 h-3 text-yellow-500" />}
                        {beat.isPromoted && <Zap className="w-3 h-3 text-purple-500" />}
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Eye className="w-3 h-3" />
                          <span>{beat.plays.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 text-sm">{beat.producer.displayName}</span>
                    {beat.producer.verified && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[8px]">✓</span>
                      </div>
                    )}
                    {beat.producer.tier === 'pro' && (
                      <Crown className="w-3 h-3 text-blue-400" />
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <Badge variant="secondary" className="text-xs">
                    {beat.genre}
                  </Badge>
                </td>
                <td className="p-3 text-gray-300 text-sm">{beat.bpm}</td>
                <td className="p-3 text-gray-300 text-sm">{beat.key}</td>
                <td className="p-3 text-gray-300 text-sm">
                  {Math.floor(beat.duration / 60)}:{(beat.duration % 60).toString().padStart(2, '0')}
                </td>
                <td className="p-3">
                  <span className="text-white font-semibold">${beat.price.basic}</span>
                  <span className="text-gray-400 text-xs ml-1">+</span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLike(beat.id)
                      }}
                    >
                      <Heart className={`w-4 h-4 ${likedBeats.has(beat.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs h-8 px-3 bg-primary hover:bg-primary/80"
                      onClick={() => setShowLicenseModal(beat.id)}
                    >
                      Buy
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Compact List View */}
      <div className="lg:hidden">
        {beats.map((beat, index) => (
          <div 
            key={beat.id}
            className={`border-b border-gray-800 p-3 hover:bg-gray-800/30 transition-colors ${
              currentlyPlaying === beat.id ? 'bg-primary/10' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Play Button & Artwork */}
              <div className="relative flex-shrink-0">
                <Image 
                  src={beat.artworkUrl} 
                  alt={beat.title}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-lg object-cover"
                  priority={false}
                />
                <button
                  onClick={() => togglePlay(beat.id)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg"
                >
                  {currentlyPlaying === beat.id && isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white font-medium text-sm truncate">{beat.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-400 text-xs">{beat.producer.displayName}</span>
                      {beat.producer.verified && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-[8px]">✓</span>
                        </div>
                      )}
                      {beat.producer.tier === 'pro' && (
                        <Crown className="w-3 h-3 text-blue-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>{beat.genre}</span>
                      <span>•</span>
                      <span>{beat.bpm} BPM</span>
                      <span>•</span>
                      <span>{beat.key}</span>
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-white font-semibold text-sm">${beat.price.basic}+</span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleLike(beat.id)
                        }}
                      >
                        <Heart className={`w-4 h-4 ${likedBeats.has(beat.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs h-8 px-3 bg-primary hover:bg-primary/80"
                        onClick={() => setShowLicenseModal(beat.id)}
                      >
                        Buy
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Stats & Badges */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {beat.isFeatured && <Star className="w-3 h-3 text-yellow-500" />}
                    {beat.isPromoted && <Zap className="w-3 h-3 text-purple-500" />}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Eye className="w-3 h-3" />
                      <span>{beat.plays.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.floor(beat.duration / 60)}:{(beat.duration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ))

  // Upload Beat Form Component - Memoized for performance
  const UploadBeatForm = React.memo(() => {
    const [formData, setFormData] = useState({
      title: '',
      genre: '',
      bpm: '',
      key: '',
      basicPrice: '',
      premiumPrice: '',
      unlimitedPrice: '',
      description: '',
      tags: ''
    })
    const [uploading, setUploading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setUploading(true)
      
      try {
        // Here you would integrate with your backend API
        // For now, we'll just simulate an upload
        await new Promise(resolve => setTimeout(resolve, 2000))
        console.log('Beat uploaded:', formData)
        setShowUploadDialog(false)
        setFormData({
          title: '',
          genre: '',
          bpm: '',
          key: '',
          basicPrice: '',
          premiumPrice: '',
          unlimitedPrice: '',
          description: '',
          tags: ''
        })
        // Reload beats after upload
        loadBeats()
      } catch (error) {
        console.error('Upload error:', error)
      } finally {
        setUploading(false)
      }
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title" className="text-white">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="genre" className="text-white">Genre</Label>
            <Select onValueChange={(value) => setFormData({...formData, genre: value})}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hip-hop">Hip Hop</SelectItem>
                <SelectItem value="trap">Trap</SelectItem>
                <SelectItem value="drill">Drill</SelectItem>
                <SelectItem value="rnb">R&B</SelectItem>
                <SelectItem value="pop">Pop</SelectItem>
                <SelectItem value="electronic">Electronic</SelectItem>
                <SelectItem value="rock">Rock</SelectItem>
                <SelectItem value="jazz">Jazz</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="bpm" className="text-white">BPM</Label>
            <Input
              id="bpm"
              type="number"
              value={formData.bpm}
              onChange={(e) => setFormData({...formData, bpm: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="key" className="text-white">Key</Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => setFormData({...formData, key: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="e.g., C minor"
              required
            />
          </div>
          <div>
            <Label htmlFor="basicPrice" className="text-white">Basic Price ($)</Label>
            <Input
              id="basicPrice"
              type="number"
              value={formData.basicPrice}
              onChange={(e) => setFormData({...formData, basicPrice: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              min="1"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="premiumPrice" className="text-white">Premium Price ($)</Label>
            <Input
              id="premiumPrice"
              type="number"
              value={formData.premiumPrice}
              onChange={(e) => setFormData({...formData, premiumPrice: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              min="1"
            />
          </div>
          <div>
            <Label htmlFor="unlimitedPrice" className="text-white">Unlimited Price ($)</Label>
            <Input
              id="unlimitedPrice"
              type="number"
              value={formData.unlimitedPrice}
              onChange={(e) => setFormData({...formData, unlimitedPrice: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              min="1"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="audio" className="text-white">Audio File</Label>
            <Input
              id="audio"
              type="file"
              accept="audio/*"
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="artwork" className="text-white">Artwork (Optional)</Label>
            <Input
              id="artwork"
              type="file"
              accept="image/*"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-white">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="tags" className="text-white">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="trap, dark, 808s, emotional"
            />
          </div>
        </div>

        <Button type="submit" disabled={uploading} className="w-full">
          {uploading ? 'Uploading...' : 'Upload Beat'}
        </Button>
      </form>
    )
  })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CustomLoader size="lg" />
          <p className="text-gray-400">
            {authLoading ? "Authenticating..." : "Loading beats marketplace..."}
          </p>
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

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950">
          {/* Breadcrumb */}
          <div className="border-b border-gray-800 bg-gray-950">
            <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
              <Breadcrumb 
                items={[
                  { label: "Beat Marketplace", current: true }
                ]}
              />
            </div>
          </div>

          {/* Content */}
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="text-center sm:text-left">
                <h1 className="text-white text-2xl sm:text-3xl font-bold mb-2">Beat Marketplace</h1>
                <p className="text-gray-400 text-sm sm:text-base">Discover and purchase high-quality beats from top producers</p>
              </div>
              
              {/* Top Controls Row */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Upload Button - Coming Soon */}
                <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700 order-1 sm:order-none relative overflow-hidden group">
                      <Upload className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Sell Your Beats</span>
                      <span className="sm:hidden">Upload</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-[500px] bg-gray-900 border-gray-800 mx-2">
                    <DialogHeader>
                      <DialogTitle className="text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                          <Upload className="w-4 h-4 text-white" />
                        </div>
                        Coming Soon
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Beat Upload Feature</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          We&apos;re working hard to bring you an amazing beat selling platform. Soon you&apos;ll be able to upload, showcase, and sell your beats to artists worldwide.
                        </p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                        <h4 className="font-medium text-white text-sm">What&apos;s Coming:</h4>
                        <ul className="space-y-1 text-xs text-gray-400">
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            High-quality audio uploads
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            Advanced licensing options
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            Real-time sales analytics
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            Instant payments
                          </li>
                        </ul>
                      </div>
                      <div className="text-center">
                        <Button 
                          variant="outline" 
                          className="border-gray-700 text-white hover:bg-gray-800"
                          onClick={() => setShowUploadDialog(false)}
                        >
                          Stay Tuned
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {/* Search Bar */}
                <div className="relative flex-1 order-2 sm:order-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search beats, producers, genres..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-700/50 text-white w-full focus:bg-gray-800 focus:border-gray-600 transition-colors"
                  />
                </div>

                {/* Controls Row */}
                <div className="flex items-center gap-2 order-3 sm:order-none">
                  {/* Genre Filter Dropdown */}
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white w-32 h-9 text-sm">
                      <SelectValue placeholder="Genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map(genre => (
                        <SelectItem key={genre} value={genre}>
                          {genre === 'all' ? 'All Genres' : genre.charAt(0).toUpperCase() + genre.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sort Dropdown */}
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white w-32 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="popular">Popular</SelectItem>
                      <SelectItem value="trending">Trending</SelectItem>
                      <SelectItem value="price_low">Price ↑</SelectItem>
                      <SelectItem value="price_high">Price ↓</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* View Toggle - Sleek Icons Only */}
                  <div className="flex items-center bg-gray-800/40 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        viewMode === 'table' 
                          ? 'text-white bg-gray-700 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/60'
                      }`}
                      title="List View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        viewMode === 'cards' 
                          ? 'text-white bg-gray-700 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/60'
                      }`}
                      title="Grid View"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Filters Dropdown */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-gray-400 hover:text-white p-0 h-auto font-normal"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    More Filters
                    <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </Button>

                  {/* Liked Beats Quick Access */}
                  {likedBeats.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Filter to show only liked beats
                        setSearchQuery('')
                        setSelectedGenre('all')
                        setSelectedMood('all')
                        // Custom filter logic would go here
                      }}
                      className="text-gray-400 hover:text-white p-0 h-auto font-normal flex items-center gap-1"
                    >
                      <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                      <span className="text-xs">Liked ({likedBeats.size})</span>
                    </Button>
                  )}
                </div>
                
                {(selectedGenre !== 'all' || selectedMood !== 'all') && (
                  <div className="text-sm text-gray-400">
                    {filteredBeats.length} beats found
                  </div>
                )}
              </div>

              {/* Collapsible Advanced Filters */}
              {showFilters && (
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Mood Filter */}
                    <div>
                      <Label className="text-white text-sm mb-2 block">Mood</Label>
                      <Select value={selectedMood} onValueChange={setSelectedMood}>
                        <SelectTrigger className="bg-gray-900/50 border-gray-600/50 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {moods.map(mood => (
                            <SelectItem key={mood} value={mood}>
                              {mood === 'all' ? 'All Moods' : mood.charAt(0).toUpperCase() + mood.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* BPM Range */}
                    <div>
                      <Label className="text-white text-sm mb-2 block">BPM Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          className="bg-gray-900/50 border-gray-600/50 text-white text-sm h-9"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          className="bg-gray-900/50 border-gray-600/50 text-white text-sm h-9"
                        />
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <Label className="text-white text-sm mb-2 block">Price Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min $"
                          className="bg-gray-900/50 border-gray-600/50 text-white text-sm h-9"
                        />
                        <Input
                          type="number"
                          placeholder="Max $"
                          className="bg-gray-900/50 border-gray-600/50 text-white text-sm h-9"
                        />
                      </div>
                    </div>

                    {/* License Type */}
                    <div>
                      <Label className="text-white text-sm mb-2 block">License Type</Label>
                      <Select>
                        <SelectTrigger className="bg-gray-900/50 border-gray-600/50 text-white">
                          <SelectValue placeholder="All Licenses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Licenses</SelectItem>
                          <SelectItem value="basic">MP3 Lease</SelectItem>
                          <SelectItem value="premium">WAV Lease</SelectItem>
                          <SelectItem value="unlimited">Unlimited</SelectItem>
                          <SelectItem value="exclusive">Exclusive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Quick Filter Tags */}
                  <div>
                    <Label className="text-white text-sm mb-2 block">Quick Filters</Label>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        className={`px-3 py-1 rounded-full text-xs transition-colors border ${
                          likedBeats.size > 0 
                            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 border-red-500/30' 
                            : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white border-gray-600/30'
                        }`}
                        onClick={() => {
                          // Toggle to show only liked beats
                          // This could filter the current view
                        }}
                      >
                        <Heart className="w-3 h-3 mr-1 inline" />
                        My Likes ({likedBeats.size})
                      </button>
                      <button className="px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-full text-xs transition-colors border border-gray-600/30">
                        <Crown className="w-3 h-3 mr-1 inline" />
                        Pro Only
                      </button>
                      <button className="px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-full text-xs transition-colors border border-gray-600/30">
                        <Zap className="w-3 h-3 mr-1 inline" />
                        Promoted
                      </button>
                      <button className="px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-full text-xs transition-colors border border-gray-600/30">
                        <Star className="w-3 h-3 mr-1 inline" />
                        Featured
                      </button>
                      <button className="px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-full text-xs transition-colors border border-gray-600/30">
                        <Users className="w-3 h-3 mr-1 inline" />
                        Stems Available
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-600/30">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-400 hover:text-white h-auto p-0"
                      onClick={() => {
                        setSelectedGenre('all')
                        setSelectedMood('all')
                        setPriceRange([0, 1000])
                      }}
                    >
                      Clear All Filters
                    </Button>
                    <div className="text-sm text-gray-400">
                      {filteredBeats.length} beats match your criteria
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="space-y-4 sm:space-y-6">
              <TabsList className="bg-gray-800 border-gray-700 w-full grid grid-cols-4 h-auto p-1.5 gap-1">
                <TabsTrigger value="all" className="data-[state=active]:bg-gray-700 text-xs sm:text-sm py-3 px-2 sm:px-4 rounded-md">
                  <span className="hidden sm:inline">All Beats</span>
                  <span className="sm:hidden">All</span>
                </TabsTrigger>
                <TabsTrigger value="featured" className="data-[state=active]:bg-gray-700 text-xs sm:text-sm py-3 px-2 sm:px-4 rounded-md">
                  <span className="hidden sm:inline">Featured</span>
                  <span className="sm:hidden">Featured</span>
                </TabsTrigger>
                <TabsTrigger value="trending" className="data-[state=active]:bg-gray-700 text-xs sm:text-sm py-3 px-2 sm:px-4 rounded-md">
                  <span className="hidden sm:inline">Trending</span>
                  <span className="sm:hidden">Trending</span>
                </TabsTrigger>
                <TabsTrigger value="my-beats" className="data-[state=active]:bg-gray-700 text-xs sm:text-sm py-3 px-2 sm:px-4 rounded-md">
                  <span className="hidden sm:inline">My Beats</span>
                  <span className="sm:hidden">Mine</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 sm:space-y-6">
                {viewMode === 'cards' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                    {filteredBeats.map((beat) => (
                      <BeatCard key={beat.id} beat={beat} />
                    ))}
                  </div>
                ) : (
                  <BeatTableView beats={filteredBeats} />
                )}
              </TabsContent>

              <TabsContent value="featured" className="space-y-4 sm:space-y-6">
                {viewMode === 'cards' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                    {filteredFeaturedBeats.map((beat) => (
                      <BeatCard key={beat.id} beat={beat} />
                    ))}
                  </div>
                ) : (
                  <BeatTableView beats={filteredFeaturedBeats} />
                )}
              </TabsContent>

              <TabsContent value="trending" className="space-y-4 sm:space-y-6">
                {viewMode === 'cards' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                    {filteredTrendingBeats.map((beat) => (
                      <BeatCard key={beat.id} beat={beat} />
                    ))}
                  </div>
                ) : (
                  <BeatTableView beats={filteredTrendingBeats} />
                )}
              </TabsContent>

              <TabsContent value="my-beats" className="space-y-4 sm:space-y-6">
                {/* Coming Soon Section for My Beats */}
                <div className="text-center py-12 sm:py-16 space-y-6">
                  <div className="space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-green-500 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center">
                        <Plus className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white">My Beats</h2>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                        <span className="text-yellow-400 text-sm font-medium">Coming Soon</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                      Your personal beat management studio is coming soon. Upload, manage, and track your beats all in one place.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                    <div className="bg-gray-800/50 rounded-lg p-4 space-y-2 border border-gray-700/50">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Upload className="w-4 h-4 text-purple-400" />
                      </div>
                      <h3 className="font-semibold text-white text-sm">Upload & Manage</h3>
                      <p className="text-xs text-gray-400">Upload beats with detailed metadata and licensing options</p>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-lg p-4 space-y-2 border border-gray-700/50">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-white text-sm">Track Performance</h3>
                      <p className="text-xs text-gray-400">Monitor plays, downloads, and revenue in real-time</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-gray-500 text-sm">Want to be notified when this feature launches?</p>
                    <Button 
                      variant="outline" 
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 21h11.5L11 15H4v6zM4 3h7l5 5H4V3z" />
                      </svg>
                      Notify Me
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* License Modal - BeatStars style */}
      {showLicenseModal && (
        <Dialog open={!!showLicenseModal} onOpenChange={() => setShowLicenseModal(null)}>
          <DialogContent className={`w-[95vw] max-w-[800px] bg-gray-900 border-gray-800 max-h-[85vh] overflow-y-auto transition-all duration-400 ease-out ${
            isAddingToCart ? 'animate-out fade-out-50 zoom-out-95 slide-out-to-bottom-10' : 'animate-in fade-in-50 zoom-in-95 slide-in-from-bottom-10'
          }`}>
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Choose Your License</DialogTitle>
            </DialogHeader>
            
            {(() => {
              const beat = beats.find(b => b.id === showLicenseModal) || 
                         featuredBeats.find(b => b.id === showLicenseModal) ||
                         trendingBeats.find(b => b.id === showLicenseModal)
              
              if (!beat) return null

              return (
                <div className="space-y-6">
                  {/* Beat Preview */}
                  <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                    <Image
                      src={beat.artworkUrl}
                      alt={beat.title}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{beat.title}</h3>
                      <p className="text-gray-400 text-sm">by {beat.producer.displayName}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>{beat.bpm} BPM</span>
                        <span>•</span>
                        <span>{beat.key}</span>
                        <span>•</span>
                        <span>{beat.genre}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => togglePlay(beat.id)}
                      className="bg-primary hover:bg-primary/80"
                    >
                      {currentlyPlaying === beat.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* License Options */}
                  <div className="grid gap-4">
                    {/* MP3 Lease */}
                    <div className="border border-gray-700 rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-white font-semibold">MP3 Lease</h4>
                            <Badge variant="secondary" className="text-xs">Most Popular</Badge>
                          </div>
                          <p className="text-gray-400 text-sm mb-3">
                            Perfect for demos, streaming, and basic commercial use
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Format:</span>
                              <span className="text-white ml-2">MP3 (320kbps)</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Streams:</span>
                              <span className="text-white ml-2">10,000</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Sales:</span>
                              <span className="text-white ml-2">2,000</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Radio:</span>
                              <span className="text-white ml-2">Included</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">${beat.price.basic}</div>
                          <Button 
                            className={`mt-2 transition-all duration-200 ${
                              isAddingToCart ? 'bg-green-500 scale-105' : 'bg-primary hover:bg-primary/80'
                            }`}
                            onClick={() => addToCart(beat.id, 'basic', beat.price.basic, beat.title, beat.producer.displayName)}
                            disabled={isAddingToCart}
                          >
                            {isAddingToCart ? '✓ Added!' : 'Add to Cart'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* WAV Lease */}
                    <div className="border border-gray-700 rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-white font-semibold">WAV Lease</h4>
                            <Badge className="bg-blue-600 text-white text-xs">Professional</Badge>
                          </div>
                          <p className="text-gray-400 text-sm mb-3">
                            High-quality WAV files for professional releases
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Format:</span>
                              <span className="text-white ml-2">WAV (24-bit)</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Streams:</span>
                              <span className="text-white ml-2">100,000</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Sales:</span>
                              <span className="text-white ml-2">10,000</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Trackout:</span>
                              <span className="text-white ml-2">Available</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">${beat.price.premium}</div>
                          <Button 
                            className={`mt-2 transition-all duration-200 ${
                              isAddingToCart ? 'bg-green-500 scale-105' : 'bg-primary hover:bg-primary/80'
                            }`}
                            onClick={() => addToCart(beat.id, 'premium', beat.price.premium, beat.title, beat.producer.displayName)}
                            disabled={isAddingToCart}
                          >
                            {isAddingToCart ? '✓ Added!' : 'Add to Cart'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Unlimited Lease */}
                    <div className="border border-gray-700 rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-white font-semibold">Unlimited Lease</h4>
                            <Badge className="bg-green-600 text-white text-xs">Best Value</Badge>
                          </div>
                          <p className="text-gray-400 text-sm mb-3">
                            Unlimited use with all formats and trackouts included
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Format:</span>
                              <span className="text-white ml-2">WAV + MP3</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Streams:</span>
                              <span className="text-white ml-2">Unlimited</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Sales:</span>
                              <span className="text-white ml-2">Unlimited</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Trackout:</span>
                              <span className="text-white ml-2">Included</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">${beat.price.unlimited}</div>
                          <Button 
                            className={`mt-2 transition-all duration-200 ${
                              isAddingToCart ? 'bg-green-500 scale-105' : 'bg-primary hover:bg-primary/80'
                            }`}
                            onClick={() => addToCart(beat.id, 'unlimited', beat.price.unlimited, beat.title, beat.producer.displayName)}
                            disabled={isAddingToCart}
                          >
                            {isAddingToCart ? '✓ Added!' : 'Add to Cart'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Exclusive Rights */}
                    <div className="border border-yellow-600 rounded-lg p-4 bg-gradient-to-r from-yellow-600/10 to-orange-600/10">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-white font-semibold">Exclusive Rights</h4>
                            <Badge className="bg-yellow-600 text-white text-xs">
                              <Crown className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-sm mb-3">
                            Full ownership rights - beat will be removed from marketplace
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Ownership:</span>
                              <span className="text-white ml-2">100% Exclusive</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Usage:</span>
                              <span className="text-white ml-2">Unlimited</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Stems:</span>
                              <span className="text-white ml-2">All Included</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Publishing:</span>
                              <span className="text-white ml-2">Full Rights</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-yellow-400">${beat.price.exclusive}</div>
                          <Button 
                            className={`mt-2 font-semibold transition-all duration-200 ${
                              isAddingToCart ? 'bg-green-500 text-white scale-105' : 'bg-yellow-600 hover:bg-yellow-700 text-black'
                            }`}
                            onClick={() => addToCart(beat.id, 'exclusive', beat.price.exclusive, beat.title, beat.producer.displayName)}
                            disabled={isAddingToCart}
                          >
                            {isAddingToCart ? '✓ Added!' : 'Buy Exclusive'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>
      )}

      {/* Floating Cart - Only visible when items in cart */}
      {getCartItemCount() > 0 && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 animate-in slide-in-from-right-10 slide-in-from-bottom-10 duration-300">
          {cartMinimized ? (
            /* Minimized Cart */
            <button
              onClick={() => setCartMinimized(false)}
              className="bg-primary hover:bg-primary/80 text-white rounded-full p-3 md:p-4 shadow-2xl transition-all duration-200 hover:scale-105"
              title="Open Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                <span className="absolute -top-2 -right-2 bg-white text-primary text-xs rounded-full min-w-[18px] h-[18px] md:min-w-[20px] md:h-[20px] flex items-center justify-center font-bold">
                  {getCartItemCount()}
                </span>
              </div>
            </button>
          ) : (
            /* Expanded Cart */
            <div className="bg-gray-900/95 border border-gray-700 rounded-lg shadow-2xl p-3 md:p-4 w-[280px] md:min-w-[300px] md:max-w-[340px] backdrop-blur-sm animate-in fade-in-50 zoom-in-95 duration-200">
              {/* Cart Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/20 rounded-full">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-white font-medium text-sm">Cart ({getCartItemCount()})</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowCartModal(true)}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-800/50"
                    title="View Full Cart"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCartMinimized(true)}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-800/50"
                    title="Minimize"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cart Items Preview (last 3 items) */}
              <div className="space-y-2 mb-3 max-h-[160px] md:max-h-[180px] overflow-y-auto">
                {cartItems.slice(-3).map((item, index) => (
                  <div key={`${item.beatId}-${item.license}`} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-md group hover:bg-gray-800/70 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{item.beatTitle}</p>
                      <p className="text-gray-400 text-xs">by {item.producer}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                          {item.license.toUpperCase()}
                        </span>
                        <span className="text-white text-xs font-medium">${item.price}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.beatId, item.license)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded opacity-0 group-hover:opacity-100"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {cartItems.length > 3 && (
                  <div className="text-center py-1">
                    <span className="text-gray-400 text-xs">+{cartItems.length - 3} more items</span>
                  </div>
                )}
              </div>

              {/* Cart Total & Actions */}
              <div className="border-t border-gray-700 pt-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-300 text-sm">Total:</span>
                  <span className="text-white font-bold text-lg">${getCartTotal()}</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCartModal(true)}
                    className="flex-1 bg-primary hover:bg-primary/80 text-white px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
                  >
                    <span className="text-white">Checkout</span>
                  </button>
                  <button
                    onClick={clearCart}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-md hover:bg-gray-800/50"
                    title="Clear Cart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pulse animation for the container when new items added */}
              <div className="absolute inset-0 rounded-lg bg-primary/10 opacity-0 animate-pulse pointer-events-none" />
            </div>
          )}
        </div>
      )}

      {/* Cart Modal */}
      <Dialog open={showCartModal} onOpenChange={setShowCartModal}>
        <DialogContent className="w-[95vw] max-w-[600px] bg-gray-900 border-gray-800 max-h-[85vh] overflow-y-auto mx-2">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Shopping Cart ({getCartItemCount()} items)
            </DialogTitle>
          </DialogHeader>
          
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">Your cart is empty</h3>
              <p className="text-gray-400 mb-4">Add some beats to get started!</p>
              <Button 
                onClick={() => setShowCartModal(false)}
                className="bg-primary hover:bg-primary/80"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {cartItems.map((item, index) => (
                  <div key={`${item.beatId}-${item.license}`} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm">{item.beatTitle}</h4>
                      <p className="text-gray-400 text-xs">by {item.producer}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {item.license.toUpperCase()} License
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">${item.price}</div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.beatId, item.license)}
                        className="text-red-400 hover:text-red-300 h-6 w-6 p-0 mt-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white font-semibold">Total:</span>
                  <span className="text-white font-bold text-lg">${getCartTotal()}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={clearCart}
                    className="flex-1 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
                  >
                    Clear Cart
                  </Button>
                  <Button 
                    className="flex-1 bg-primary hover:bg-primary/80"
                    onClick={() => {
                      // Implement checkout logic here
                      console.log('Proceeding to checkout with items:', cartItems)
                      setShowCartModal(false)
                    }}
                  >
                    Checkout
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* WaveSurfer Audio Player */}
      {currentBeat && (
        <WaveSurferPlayer
          audioUrl={currentBeat.audioUrl}
          beatTitle={currentBeat.title}
          producerName={currentBeat.producer.displayName}
          artworkUrl={currentBeat.artworkUrl}
          onNext={getNextBeat}
          onPrevious={getPreviousBeat}
          isVisible={!!currentBeat}
        />
      )}
    </div>
  )
}
