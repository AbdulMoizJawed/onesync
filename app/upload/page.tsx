"use client"

import { DialogFooter } from "@/components/ui/dialog"
import Image from "next/image"
import dynamic from "next/dynamic"

import type React from "react"
import type { Database } from "@/lib/supabase"

import { useState, useRef, useEffect, useCallback } from "react"
import { useAuth, supabase } from "@/lib/auth"

// Dynamic imports for heavy components
const ArtistSearch = dynamic(() => import("@/components/artist-search").then(mod => ({ default: mod.ArtistSearch })), {
  loading: () => <div className="animate-pulse bg-gray-800 h-10 rounded" />,
  ssr: false
})

const ProductOfferingsModal = dynamic(() => import("@/components/product-offerings-modal").then(mod => ({ default: mod.ProductOfferingsModal })), {
  loading: () => null,
  ssr: false
})

import type { ArtistSearchResult } from "@/lib/music-apis"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Upload,
  Music,
  ImageIcon,
  Globe,
  Settings,
  Info,
  X,
  Plus,
  Check,
  AlertCircle,
  Zap,
  Shield,
  Cpu,
  Star,
} from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { AuthGuard } from "@/components/auth-guard"
import { MUSIC_GENRES, EXPANDED_GENRES, MUSIC_STORES, LANGUAGES, RELEASE_TYPES, SINGLE_PRICE_TIERS, ALBUM_PRICE_TIERS } from "@/lib/constants"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Track {
  id: string
  title: string
  file: File | null
  duration: number
  explicit: boolean
  isrc: string
  artist: string
  featuredArtist: string
  mainGenre: string
  subGenre: string
  lyricist: string
  composer: string
  lyrics: string
}

interface ExclusiveRightsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (hasRights: boolean) => void
}

type Artist = Database["public"]["Tables"]["artists"]["Row"]

function ExclusiveRightsDialog({ open, onOpenChange, onConfirm }: ExclusiveRightsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass rounded-xl max-w-md border-gray-600">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-600/20 to-gray-500/20 rounded-full mx-auto mb-4 border border-gray-600/30">
            <Shield className="w-8 h-8 text-gray-400" />
          </div>
          <DialogTitle className="text-xl font-bold text-center text-white">
            Exclusive Rights Verification
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-300 text-center leading-relaxed">
            TikTok, Facebook/Instagram and YouTube Content ID require{" "}
            <span className="text-gray-300 font-semibold">exclusive rights</span> to all content. Unauthorized
            distribution may result in account termination.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1 border-rose-500/50 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500 bg-transparent"
            onClick={() => {
              onConfirm(false)
              onOpenChange(false)
            }}
          >
            Deny Access
          </Button>
          <Button
            className="flex-1 button-primary"
            onClick={() => {
              onConfirm(true)
              onOpenChange(false)
            }}
          >
            Confirm Rights
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Cache key for localStorage
const UPLOAD_CACHE_KEY = 'music-upload-form-data'

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

export default function UploadPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("basic")
  const [uploading, setUploading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showExclusiveDialog, setShowExclusiveDialog] = useState(false)
  const [showProductOfferingsModal, setShowProductOfferingsModal] = useState(false)
  const [hasExclusiveRights, setHasExclusiveRights] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [previousArtists, setPreviousArtists] = useState<string[]>([])
  const [showArtistSuggestions, setShowArtistSuggestions] = useState(false)
  const [filteredArtists, setFilteredArtists] = useState<string[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [redirectCountdown, setRedirectCountdown] = useState(3)
  const [isArtistValidSelection, setIsArtistValidSelection] = useState(false)
  const [selectedArtists, setSelectedArtists] = useState<string[]>([])
  const [artistInputValue, setArtistInputValue] = useState("")
  
  // Featured artist state
  const [selectedFeaturedArtists, setSelectedFeaturedArtists] = useState<string[]>([])
  const [featuredArtistInputValue, setFeaturedArtistInputValue] = useState("")
  const [showFeaturedArtistSuggestions, setShowFeaturedArtistSuggestions] = useState(false)
  const [filteredFeaturedArtists, setFilteredFeaturedArtists] = useState<string[]>([])
  const [selectedFeaturedSuggestionIndex, setSelectedFeaturedSuggestionIndex] = useState(-1)

  const [formData, setFormData] = useState({
    // Required fields
    title: "",
    artist: "",
    featuredArtist: "",
    lyricist: "",
    genre: "",
    releaseDate: "",
    artworkName: "",
    catNumber: "",
    mainGenre: "",
    subGenre: "",

    // Optional fields
    displayArtist: "",
    upc: "",
    publisher: "",
    composer: "",
    recordLabel: "",
    pLine: "",
    cLine: "",
    lyrics: "",
    releaseType: "single",
    language: "en",
    copyrightYear: new Date().getFullYear(),
    description: "",
    tags: [] as string[],
    priceTier: "0.99",
    customPrice: 0,
  })

  const [artists, setArtists] = useState<Artist[]>([])
  const [isAddArtistDialogOpen, setIsAddArtistDialogOpen] = useState(false)
  const [isAddFeaturedArtistDialogOpen, setIsAddFeaturedArtistDialogOpen] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [newArtist, setNewArtist] = useState({
    name: "",
    spotifyUrl: "",
    appleMusicUrl: "",
    createSpotify: false,
    createAppleMusic: false,
  })
  const [savingArtist, setSavingArtist] = useState(false)

  const [coverArt, setCoverArt] = useState<File | null>(null)
  const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["Worldwide"])
  const [newTag, setNewTag] = useState("")

  // Load cached form data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(UPLOAD_CACHE_KEY)
        if (cached) {
          const parsedCache = JSON.parse(cached)
          if (parsedCache.formData) {
            setFormData(prev => ({ ...prev, ...parsedCache.formData }))
            // Artists will be initialized when previousArtists loads
            if (parsedCache.formData.artist) {
              setIsArtistValidSelection(false) // Will be validated when previousArtists loads
            } else {
              setIsArtistValidSelection(true)
            }
          }
          if (parsedCache.selectedStores) {
            setSelectedStores(parsedCache.selectedStores)
          }
          if (parsedCache.selectedCountries) {
            setSelectedCountries(parsedCache.selectedCountries)
          }
          if (parsedCache.hasExclusiveRights) {
            setHasExclusiveRights(parsedCache.hasExclusiveRights)
          }
          if (parsedCache.activeTab) {
            setActiveTab(parsedCache.activeTab)
          }
        }
      } catch (error) {
        console.error('Error loading cached form data:', error)
      }
    }
  }, [])

  // Save form data to cache whenever it changes
  const saveToCacheDebounced = useCallback(
    debounce((data: any) => {
      if (typeof window !== 'undefined') {
        try {
          const cacheData = {
            formData: data.formData,
            selectedStores: data.selectedStores,
            selectedCountries: data.selectedCountries,
            hasExclusiveRights: data.hasExclusiveRights,
            activeTab: data.activeTab,
            timestamp: Date.now()
          }
          localStorage.setItem(UPLOAD_CACHE_KEY, JSON.stringify(cacheData))
        } catch (error) {
          console.error('Error caching form data:', error)
        }
      }
    }, 1000),
    []
  )

  // Save to cache when relevant data changes
  useEffect(() => {
    saveToCacheDebounced({
      formData,
      selectedStores,
      selectedCountries,
      hasExclusiveRights,
      activeTab
    })
  }, [formData, selectedStores, selectedCountries, hasExclusiveRights, activeTab, saveToCacheDebounced])

  // Clear cache on successful upload
  const clearCache = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(UPLOAD_CACHE_KEY)
    }
  }, [])

  // Complete form reset function
  const resetForm = useCallback(() => {
    // Reset form data to initial state
    setFormData({
      // Required fields
      title: "",
      artist: "",
      featuredArtist: "",
      lyricist: "",
      genre: "",
      releaseDate: "",
      artworkName: "",
      catNumber: "",
      mainGenre: "",
      subGenre: "",

      // Optional fields
      displayArtist: "",
      upc: "",
      publisher: "",
      composer: "",
      recordLabel: "",
      pLine: "",
      cLine: "",
      lyrics: "",
      releaseType: "single",
      language: "en",
      copyrightYear: new Date().getFullYear(),
      description: "",
      tags: [] as string[],
      priceTier: "0.99",
      customPrice: 0,
    })

    // Reset artist selections
    setSelectedArtists([])
    setArtistInputValue("")
    setSelectedFeaturedArtists([])
    setFeaturedArtistInputValue("")
    setShowArtistSuggestions(false)
    setShowFeaturedArtistSuggestions(false)
    
    // Reset tracks
    setTracks([])

    // Reset cover art
    setCoverArt(null)
    if (coverArtPreview) {
      URL.revokeObjectURL(coverArtPreview)
    }
    setCoverArtPreview(null)

    // Reset file inputs
    if (audioFileRef.current) {
      audioFileRef.current.value = ""
    }
    if (coverArtRef.current) {
      coverArtRef.current.value = ""
    }

    // Reset stores selection
    setSelectedStores([])

    // Reset form state
    setActiveTab("basic")
    setUploadError(null)
    setUploading(false)
    setUploadProgress(0)
    setShowExclusiveDialog(false)
    setHasExclusiveRights(false)

    // Clear localStorage cache
    clearCache()

    console.log('✅ Form completely reset')
  }, [clearCache, coverArtPreview])

  // Fetch previous artists from database
  const fetchPreviousArtists = useCallback(async () => {
    if (!user || !supabase) return

    try {
      // Fetch from artists table instead of releases table
      const { data, error } = await supabase
        .from('artists')
        .select('name')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching previous artists:', error)
        return
      }

      // Extract unique artist names
      const uniqueArtists = [...new Set(data.map(artist => artist.name))]
        .filter(artist => artist && artist.trim() !== '')
      
      setPreviousArtists(uniqueArtists)
      
      // Initialize selected artists from form data if it exists
      if (formData.artist.trim() !== '') {
        const artistsFromForm = formData.artist.split(' & ').map(a => a.trim()).filter(a => a !== '')
        const validArtists = artistsFromForm.filter(artist => uniqueArtists.includes(artist))
        setSelectedArtists(validArtists)
        setFormData((prev) => ({ ...prev, artist: validArtists.join(' & ') }))
        setIsArtistValidSelection(validArtists.length > 0 || formData.artist.trim() === '')
      }
    } catch (error) {
      console.error('Error fetching previous artists:', error)
    }
  }, [user, supabase, formData.artist])

  // Load previous artists when component mounts
  useEffect(() => {
    fetchPreviousArtists()
  }, [fetchPreviousArtists])

  // Auto redirect to releases page after successful upload
  useEffect(() => {
    if (uploadSuccess) {
      setRedirectCountdown(3)
      
      const countdownInterval = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            router.push('/releases')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(countdownInterval)
    }
  }, [uploadSuccess, router])

  // Handle artist input changes - now readonly, so this mainly handles dropdown filtering
  const handleArtistInputChange = (value: string) => {
    // Since input is readonly, this shouldn't be called for typing
    // But we keep it for any programmatic changes
    setArtistInputValue(value)
    setSelectedSuggestionIndex(-1)
  }

  // Handle artist suggestion selection
  const handleArtistSuggestionSelect = (artist: string) => {
    if (!selectedArtists.includes(artist)) {
      const newSelectedArtists = [...selectedArtists, artist]
      setSelectedArtists(newSelectedArtists)
      setFormData((prev) => ({ ...prev, artist: newSelectedArtists.join(' & ') }))
    }
    setArtistInputValue("") // Clear input after selection
    setShowArtistSuggestions(false)
    setFilteredArtists([])
    setSelectedSuggestionIndex(-1)
    setIsArtistValidSelection(true)
  }

  // Remove selected artist
  const removeSelectedArtist = (artistToRemove: string) => {
    const newSelectedArtists = selectedArtists.filter(artist => artist !== artistToRemove)
    setSelectedArtists(newSelectedArtists)
    setFormData((prev) => ({ ...prev, artist: newSelectedArtists.join(' & ') }))
    if (newSelectedArtists.length === 0) {
      setIsArtistValidSelection(true) // Empty is valid
    }
  }

  // Featured artist handlers - now readonly, so this mainly handles programmatic changes
  const handleFeaturedArtistInputChange = (value: string) => {
    // Since input is readonly, this shouldn't be called for typing
    // But we keep it for any programmatic changes
    setFeaturedArtistInputValue(value)
    setSelectedFeaturedSuggestionIndex(-1)
  }

  const handleFeaturedArtistSuggestionSelect = (artist: string) => {
    if (!selectedFeaturedArtists.includes(artist)) {
      const newSelectedFeaturedArtists = [...selectedFeaturedArtists, artist]
      setSelectedFeaturedArtists(newSelectedFeaturedArtists)
      setFormData((prev) => ({ ...prev, featuredArtist: newSelectedFeaturedArtists.join(' & ') }))
    }
    setFeaturedArtistInputValue("")
    setShowFeaturedArtistSuggestions(false)
    setFilteredFeaturedArtists([])
    setSelectedFeaturedSuggestionIndex(-1)
  }

  const removeSelectedFeaturedArtist = (artistToRemove: string) => {
    const newSelectedFeaturedArtists = selectedFeaturedArtists.filter(artist => artist !== artistToRemove)
    setSelectedFeaturedArtists(newSelectedFeaturedArtists)
    setFormData((prev) => ({ ...prev, featuredArtist: newSelectedFeaturedArtists.join(' & ') }))
  }

  // Handle keyboard navigation for artist suggestions
  const handleArtistInputKeyDown = (e: React.KeyboardEvent) => {
    if (!showArtistSuggestions || filteredArtists.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < filteredArtists.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : filteredArtists.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestionIndex >= 0) {
          handleArtistSuggestionSelect(filteredArtists[selectedSuggestionIndex])
        }
        break
      case 'Escape':
        setShowArtistSuggestions(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (coverArtPreview) {
        URL.revokeObjectURL(coverArtPreview)
      }
    }
  }, [coverArtPreview])

  // Auto-populate track fields when form data changes
  useEffect(() => {
    if (tracks.length > 0) {
      setTracks(prevTracks => 
        prevTracks.map(track => ({
          ...track,
          artist: track.artist || formData.artist,
          featuredArtist: track.featuredArtist || formData.featuredArtist,
          mainGenre: track.mainGenre || formData.genre,
          subGenre: track.subGenre || formData.subGenre,
          lyricist: track.lyricist || formData.lyricist,
          composer: track.composer || formData.composer,
        }))
      )
    }
  }, [formData.artist, formData.featuredArtist, formData.genre, formData.subGenre, formData.lyricist, formData.composer])

  const coverArtRef = useRef<HTMLInputElement>(null)
  const audioFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchArtists = async () => {
      if (!user) return
      try {
        if (!supabase) return
        
        const { data, error } = await supabase.from("artists").select().eq("user_id", user.id)
        if (error) throw error
        setArtists(data || [])
      } catch (e) {
        console.error("Error fetching artists:", e)
      }
    }
    fetchArtists()
  }, [user, supabase])

  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        // Require exactly 3000x3000 pixels (mandatory)
        const isCorrectSize = img.width === 3000 && img.height === 3000
        resolve(isCorrectSize)
      }
      img.onerror = () => resolve(false)
      img.src = URL.createObjectURL(file)
    })
  }

  const handleCoverArtChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    const validTypes = ["image/jpeg"]
    if (!validTypes.includes(file.type)) {
      setUploadError("Please select a JPG image file only")
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      setUploadError("Cover art file size must be less than 100MB")
      return
    }

    // Validate image dimensions
    const isValidDimensions = await validateImageDimensions(file)
    if (!isValidDimensions) {
      setUploadError("Cover art must be exactly 3000x3000 pixels for optimal quality across all platforms")
      return
    }

    // Clean up previous object URL to prevent memory leaks
    if (coverArtPreview) {
      URL.revokeObjectURL(coverArtPreview)
    }
    
    setCoverArt(file)
    setCoverArtPreview(URL.createObjectURL(file))
  }

  // Extract audio duration from file
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.onloadedmetadata = () => {
        resolve(Math.round(audio.duration))
      }
      audio.onerror = () => {
        resolve(0) // Default duration if unable to extract
      }
      audio.src = URL.createObjectURL(file)
    })
  }

  // Validate WAV file format specifications
  const validateWAVFormat = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer
          if (!arrayBuffer) {
            resolve(false)
            return
          }
          
          const dataView = new DataView(arrayBuffer)
          
          // Check RIFF header
          const riffHeader = String.fromCharCode(
            dataView.getUint8(0),
            dataView.getUint8(1), 
            dataView.getUint8(2),
            dataView.getUint8(3)
          )
          
          // Check WAVE format
          const waveHeader = String.fromCharCode(
            dataView.getUint8(8),
            dataView.getUint8(9),
            dataView.getUint8(10),
            dataView.getUint8(11)
          )
          
          if (riffHeader !== 'RIFF' || waveHeader !== 'WAVE') {
            resolve(false)
            return
          }
          
          // Find fmt chunk (typically starts at byte 12)
          let offset = 12
          while (offset < arrayBuffer.byteLength - 8) {
            const chunkId = String.fromCharCode(
              dataView.getUint8(offset),
              dataView.getUint8(offset + 1),
              dataView.getUint8(offset + 2),
              dataView.getUint8(offset + 3)
            )
            
            const chunkSize = dataView.getUint32(offset + 4, true)
            
            if (chunkId === 'fmt ') {
              // Found format chunk
              const sampleRate = dataView.getUint32(offset + 12, true)
              const bitsPerSample = dataView.getUint16(offset + 22, true)
              
              // Check if sample rate is 44.1kHz or 48kHz
              const validSampleRates = [44100, 48000]
              const validBitDepths = [16, 24]
              
              const isValidSampleRate = validSampleRates.includes(sampleRate)
              const isValidBitDepth = validBitDepths.includes(bitsPerSample)
              
              console.log(`🎵 WAV Analysis: Sample Rate: ${sampleRate}Hz, Bit Depth: ${bitsPerSample}-bit`)
              
              resolve(isValidSampleRate && isValidBitDepth)
              return
            }
            
            // Move to next chunk
            offset += 8 + chunkSize
          }
          
          // fmt chunk not found
          resolve(false)
        } catch (error) {
          console.error('Error analyzing WAV file:', error)
          resolve(false)
        }
      }
      
      reader.onerror = () => resolve(false)
      
      // Read first 1KB of file (should contain headers)
      const blob = file.slice(0, 1024)
      reader.readAsArrayBuffer(blob)
    })
  }

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadError(null)
    
    console.log('🎵 Audio files selected:', files.length)
    files.forEach((file, index) => {
      console.log(`File ${index + 1}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        sizeInMB: (file.size / 1024 / 1024).toFixed(2)
      })
    })

    if (files.length === 0) {
      console.log('❌ No files selected')
      return
    }

    setUploading(true) // Show loading state while processing files

    try {
      const newTracks: Track[] = []

      for (let index = 0; index < files.length; index++) {
        const file = files[index]
        
        // Enhanced audio format validation - WAV only (16-bit or 24-bit, 44.1kHz or 48kHz)
        const validAudioTypes = [
          "audio/wav", 
          "audio/wave",
          "audio/x-wav"
        ]
        const allowedExtensions = /\.(wav)$/i
        
        // Only accept WAV files for professional quality
        const isValidType = validAudioTypes.includes(file.type.toLowerCase()) || 
                           allowedExtensions.test(file.name.toLowerCase())

        console.log(`🔍 File ${file.name} validation:`, {
          type: file.type,
          extension: file.name.split('.').pop(),
          isValidType,
          size: file.size,
          sizeOK: file.size <= 100 * 1024 * 1024 && file.size >= 1000
        })

        if (!isValidType) {
          console.log(`❌ Invalid audio format for ${file.name}`)
          setUploadError(`Track "${file.name}" must be in WAV format only. We require uncompressed WAV files (16-bit or 24-bit at 44.1kHz or 48kHz) for professional distribution quality.`)
          setUploading(false)
          return
        }

        // Advanced WAV format validation using file headers
        const isValidWAVFormat = await validateWAVFormat(file)
        if (!isValidWAVFormat) {
          console.log(`❌ Invalid WAV format specifications for ${file.name}`)
          setUploadError(`Track "${file.name}" does not meet required specifications. Please ensure your WAV file is 16-bit or 24-bit at 44.1kHz or 48kHz sample rate.`)
          setUploading(false)
          return
        }

        // Check file size (maximum 100MB for audio files)
        if (file.size > 100 * 1024 * 1024) {
          setUploadError(`${file.name}: Audio file too large. Maximum size is 100MB`)
          setUploading(false)
          return
        }

        // Minimum file size check (to catch empty/corrupted files)
        if (file.size < 1000) {
          setUploadError(`${file.name}: Audio file appears to be corrupted or empty`)
          setUploading(false)
          return
        }

        // Extract duration with error handling
        let duration = 0
        try {
          duration = await getAudioDuration(file)
        } catch (error) {
          console.warn(`Could not get duration for ${file.name}:`, error)
          // Continue without duration - user can manually set it
        }

        const newTrack: Track = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          file,
          duration,
          explicit: false,
          isrc: "",
          artist: formData.artist || user?.user_metadata?.full_name || "",
          featuredArtist: formData.featuredArtist || "",
          mainGenre: formData.genre || "",
          subGenre: formData.subGenre || "",
          lyricist: formData.lyricist || "",
          composer: formData.composer || "",
          lyrics: formData.lyrics || "",
        }

        newTracks.push(newTrack)
        console.log(`✅ Track ${index + 1} processed:`, newTrack.title)
      }

      console.log(`🎵 Adding ${newTracks.length} tracks to the list`)
      setTracks((prev) => [...prev, ...newTracks])
      setUploadError(null)
      console.log('✅ Tracks successfully added to state')
    } catch (error) {
      console.error('Error processing audio files:', error)
      setUploadError('Error processing audio files. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const removeTrack = (trackId: string) => {
    setTracks((prev) => prev.filter((track) => track.id !== trackId))
  }

  const updateTrack = (trackId: string, updates: Partial<Track>) => {
    setTracks((prev) => prev.map((track) => (track.id === trackId ? { ...track, ...updates } : track)))
  }

  const handleStoreChange = (storeId: string, checked: boolean) => {
    const socialStores = ["tiktok", "facebook-instagram"]

    if (checked && socialStores.includes(storeId) && !hasExclusiveRights) {
      setShowExclusiveDialog(true)
      return
    }

    setSelectedStores((prev) => (checked ? [...prev, storeId] : prev.filter((id) => id !== storeId)))
  }

  const handleSelectAllStores = () => {
    const allStores = [
      "spotify",
      "apple-music",
      "youtube-music",
      "amazon-music",
      "deezer",
      "tidal",
      "pandora",
      "soundcloud",
      "bandcamp",
      "beatport",
      "traxsource",
      "juno-download",
      "7digital",
      "qobuz",
      "napster",
      "iheartradio",
      "shazam",
      "anghami",
      "joox",
      "netease",
      "tiktok",
      "facebook-instagram",
      "twitch",
      "audiomack",
    ]

    if (selectedStores.length === allStores.length) {
      setSelectedStores([])
    } else {
      setSelectedStores(allStores)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const handleAddArtist = async () => {
    if (!user || !supabase) return

    if (!newArtist.name) {
      alert("Artist name is required.")
      return
    }
    if (!newArtist.spotifyUrl && !newArtist.createSpotify) {
      alert("Spotify for Artists link is required, or select the 'create for me' option.")
      return
    }
    if (!newArtist.appleMusicUrl && !newArtist.createAppleMusic) {
      alert("Apple Music for Artists link is required, or select the 'create for me' option.")
      return
    }

    setSavingArtist(true)
    try {
      const { data, error } = await supabase
        .from("artists")
        .insert({
          user_id: user.id,
          name: newArtist.name,
          social_media: {
            spotify: newArtist.createSpotify ? "pending_creation" : newArtist.spotifyUrl,
            appleMusic: newArtist.createAppleMusic ? "pending_creation" : newArtist.appleMusicUrl,
          },
          status: "active",
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      setArtists((prev) => [...prev, data])
      
      // Add new artist to selected artists list
      if (!selectedArtists.includes(data.name)) {
        const newSelectedArtists = [...selectedArtists, data.name]
        setSelectedArtists(newSelectedArtists)
        setFormData((prev) => ({ ...prev, artist: newSelectedArtists.join(' & ') }))
      }
      
      setIsArtistValidSelection(true) // Mark as valid when created via + button
      setIsAddArtistDialogOpen(false)
      setNewArtist({
        name: "",
        spotifyUrl: "",
        appleMusicUrl: "",
        createSpotify: false,
        createAppleMusic: false,
      })
    } catch (err: any) {
      console.error("Failed to save artist:", err)
      alert(`Failed to add artist. Please check the browser console for more details. Error: ${err.message}`)
    } finally {
      setSavingArtist(false)
    }
  }

  const handleSubmit = async () => {
    console.log('🚀 Upload process started')
    
    if (!user || !supabase) {
      console.error('❌ No user or supabase client')
      setUploadError("Upload service is not available. Please check your configuration.")
      return
    }

    setUploadError(null)

    // Validation checks with detailed logging
    console.log('🔍 Validating form data...')
    console.log('Form data:', {
      title: formData.title,
      artist: formData.artist,
      genre: formData.genre,
      subGenre: formData.subGenre,
      copyrightYear: formData.copyrightYear
    })

    if (!formData.title || !formData.artist || !formData.genre || !formData.subGenre || !formData.copyrightYear || selectedArtists.length === 0) {
      const missing = []
      if (!formData.title) missing.push('title')
      if (!formData.artist || selectedArtists.length === 0) missing.push('primary artist (must select from dropdown)')
      if (!formData.genre) missing.push('primary genre')
      if (!formData.subGenre) missing.push('secondary genre')
      if (!formData.copyrightYear) missing.push('copyright year')
      
      console.error('❌ Missing required fields:', missing)
      setUploadError(`Please fill in all required fields: ${missing.join(', ')}`)
      return
    }

    if (!coverArt) {
      console.error('❌ No cover art uploaded')
      setUploadError("Please upload cover art")
      return
    }

    if (tracks.length === 0) {
      console.error('❌ No tracks uploaded')
      setUploadError("Please upload at least one track")
      return
    }

    if (selectedStores.length === 0) {
      console.error('❌ No stores selected')
      setUploadError("Please select at least one store")
      return
    }

    if (!termsAccepted) {
      console.error('❌ Terms and conditions not accepted')
      setUploadError("Please accept the terms and conditions to continue with your release")
      return
    }

    console.log(`✅ Validation passed - ${tracks.length} tracks, cover art ready, ${selectedStores.length} stores selected`)

    setUploading(true)
    setUploadProgress(0)

    try {
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substr(2, 9)
      // Sanitize user ID to prevent path traversal
      const sanitizedUserId = user.id.replace(/[^a-zA-Z0-9-_]/g, '')
      const releaseFolder = `${sanitizedUserId}/releases/${timestamp}-${randomId}`

      // 1. Upload files to Supabase Storage via API
      setUploadProgress(10)
      console.log('� Uploading files to Supabase Storage...')
      
      // Get the current session for authorization
      const { data: { session } } = await supabase!.auth.getSession()
      const accessToken = session?.access_token
      
      if (!accessToken) {
        throw new Error('No access token available for upload. Please try logging out and back in.')
      }
      
      // Create form data for file upload
      const uploadFormData = new FormData()
      uploadFormData.append('releaseFolder', releaseFolder)
      uploadFormData.append('userId', user.id)
      uploadFormData.append('coverArt', coverArt)
      
      // Add all tracks with progress tracking
      let totalBytes = coverArt.size
      tracks.forEach((track, index) => {
        if (track.file) {
          uploadFormData.append(`audioFile${index}`, track.file)
          totalBytes += track.file.size
        }
      })
      
      console.log(`📊 Total upload size: ${(totalBytes / (1024 * 1024)).toFixed(2)}MB`)
      
      // Create a controller to abort if necessary
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 119000) // Just under 2 minutes
      
      let uploadResult;
      
      try {
        // Upload using Supabase storage API with timeout handling
        const uploadResponse = await fetch('/api/supabase-upload', {
          method: 'POST',
          body: uploadFormData,
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!uploadResponse.ok) {
          let errorMessage = 'Upload failed'
          try {
            const errorData = await uploadResponse.json()
            errorMessage = errorData.error || errorData.details || `Error ${uploadResponse.status}: ${uploadResponse.statusText}`
            console.error('Upload error details:', errorData)
          } catch (parseError) {
            console.error('Error parsing upload error response:', parseError)
            errorMessage = `Error ${uploadResponse.status}: ${uploadResponse.statusText}`
          }
          throw new Error(errorMessage)
        }
        
        uploadResult = await uploadResponse.json()
        console.log('✅ Files uploaded successfully to Supabase Storage')
        router.push('/artist-tools')
      } catch (uploadError) {
        console.error('❌ Error uploading files:', uploadError)
        throw new Error(uploadError instanceof Error ? uploadError.message : 'File upload failed')
      }
      
      // Use the URLs from the upload
      const coverArtUrl = uploadResult.coverArtUrl
      
      setUploadProgress(50)
      
      // Process uploaded tracks
      const uploadedTracks = []
      const audioUrls = uploadResult.audioUrls || []
      
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i]
        if (!track.file) continue
        
        uploadedTracks.push({
          ...track,
          file_url: audioUrls[i] || '',
          track_number: i + 1,
        })
        
        // Update progress for each track
        setUploadProgress(40 + (i + 1) * (30 / tracks.length))
      }

      setUploadProgress(70)

      // 3. Create or update artist record for dropdown
      console.log('🎤 Creating/updating artist record for dropdown...')
      try {
        // Check if artist already exists for this user
        const { data: existingArtist, error: artistCheckError } = await supabase
          .from('artists')
          .select('id, name')
          .eq('user_id', user.id)
          .ilike('name', formData.artist.trim())
          .single()

        if (artistCheckError && artistCheckError.code !== 'PGRST116') {
          console.warn('⚠️ Error checking for existing artist:', artistCheckError.message)
        }

        if (!existingArtist) {
          // Create new artist record
          const { data: newArtist, error: artistCreateError } = await supabase
            .from('artists')
            .insert({
              user_id: user.id,
              name: formData.artist.trim(),
              status: 'active'
            })
            .select()
            .single()

          if (artistCreateError) {
            console.warn('⚠️ Could not create artist record:', artistCreateError.message)
          } else {
            console.log('✅ Created new artist record:', newArtist.name)
          }
        } else {
          console.log('✅ Artist already exists:', existingArtist.name)
        }
      } catch (artistError) {
        console.warn('⚠️ Error managing artist record:', artistError)
      }

      // 4. Create release record with valid status
      const { data: releaseData, error: releaseError } = await supabase
        .from("releases")
        .insert({
          user_id: user.id,
          title: formData.title,
          artist_name: formData.artist,
          genre: formData.genre,
          release_date: formData.releaseDate || null,
          cover_art_url: coverArtUrl,
          audio_url: uploadedTracks[0]?.file_url || null,
          status: "pending", // Set to pending when uploaded
          platforms: selectedStores,
          metadata: {
            displayArtist: formData.displayArtist,
            upc: formData.upc,
            publisher: formData.publisher,
            featuredArtist: formData.featuredArtist,
            lyricist: formData.lyricist,
            composer: formData.composer,
            recordLabel: formData.recordLabel,
            pLine: formData.pLine,
            cLine: formData.cLine,
            lyrics: formData.lyrics,
            releaseType: formData.releaseType,
            language: formData.language,
            copyrightYear: formData.copyrightYear,
            description: formData.description,
            tags: formData.tags,
            priceTier: formData.priceTier,
            mainGenre: formData.mainGenre,
            subGenre: formData.subGenre,
          },
        })
        .select()
        .single()

      if (releaseError) {
        console.error("Release insert error:", releaseError)
        throw new Error(`Failed to create release: ${releaseError.message}`)
      }

      setUploadProgress(85)

      // 5. Create track records
      if (uploadedTracks.length > 0) {
        const trackInserts = uploadedTracks.map((track) => ({
          release_id: releaseData.id,
          title: track.title,
          file_url: track.file_url,
          track_number: track.track_number,
          isrc: track.isrc || null,
          explicit: track.explicit,
        }))

        const { error: tracksError } = await supabase.from("tracks").insert(trackInserts)

        if (tracksError) {
          console.error("Tracks insert error:", tracksError)
          // Don't throw here, release was created successfully
        }
      }

      setUploadProgress(100)

      // Small delay to show 100% progress
      await new Promise((resolve) => setTimeout(resolve, 500))

      setUploadProgress(100)
      setUploadSuccess(true)
      
      // Refresh artists list to include newly created artist
      fetchPreviousArtists()
      
      // Clear cached form data on successful upload
      clearCache()
      
      // Trigger confetti animation
      triggerConfetti()
    } catch (error: any) {
      console.error("Upload error:", error)
      setUploadError(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleSaveDraft = async () => {
    if (!user) {
      setUploadError("Please sign in to save drafts")
      return
    }

    setSavingDraft(true)
    setUploadError(null)

    try {
      console.log('💾 Starting upload process...')
      let coverArtUrl = null

      // Upload cover art if provided
      if (coverArt) {
        console.log('📸 Uploading cover art using hybrid storage...')
        const timestamp = Date.now()
        const sanitizedUserId = user.id.replace(/[^a-zA-Z0-9-_]/g, '')
        const releaseFolder = `${sanitizedUserId}/drafts/${timestamp}`
        
        // Get the current session for authorization
        const { data: { session } } = await supabase!.auth.getSession()
        const accessToken = session?.access_token
        
        if (!accessToken) {
          throw new Error('No access token available for upload')
        }
        
        // Create form data for cover art upload
        const uploadFormData = new FormData()
        uploadFormData.append('file', coverArt)
        uploadFormData.append('userId', user.id)
        uploadFormData.append('type', 'cover-art')
        uploadFormData.append('folder', 'drafts')
        
        // Upload using universal upload API
        const uploadResponse = await fetch('/api/upload/universal', {
          method: 'POST',
          body: uploadFormData,
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(`Cover art upload failed: ${errorData.error || uploadResponse.statusText}`)
        }
        
        const uploadResult = await uploadResponse.json()
        console.log('✅ Cover art uploaded successfully')
        coverArtUrl = uploadResult.file.url
        console.log('🔗 Cover art URL:', coverArtUrl)
      }

      console.log('📝 Creating draft release...')
      const draftData = {
        title: formData.title,
        artist_name: formData.artist,
        genre: formData.genre,
        release_date: formData.releaseDate,
        description: formData.description,
        cover_art_url: coverArtUrl,
        tracks: tracks.map(track => ({
          title: track.title,
          artist: track.artist,
          mainGenre: track.mainGenre,
          subGenre: track.subGenre,
          explicit: track.explicit,
          isrc: track.isrc
        })),
        platforms: selectedStores,
        metadata: {
          displayArtist: formData.displayArtist,
          upc: formData.upc,
          publisher: formData.publisher,
          featuredArtist: formData.featuredArtist,
          lyricist: formData.lyricist,
          composer: formData.composer,
          recordLabel: formData.recordLabel,
          pLine: formData.pLine,
          cLine: formData.cLine,
          lyrics: formData.lyrics,
          releaseType: formData.releaseType,
          language: formData.language,
          copyrightYear: formData.copyrightYear,
          description: formData.description,
          tags: formData.tags,
          priceTier: formData.priceTier,
          mainGenre: formData.mainGenre,
          subGenre: formData.subGenre,
          countries: selectedCountries
        }
      }
      
      console.log('Draft data:', {
        title: draftData.title,
        artist_name: draftData.artist_name,
        tracksCount: draftData.tracks.length,
        platformsCount: draftData.platforms.length,
        hasCoverArt: !!draftData.cover_art_url
      })

      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftData)
      })

      console.log('📤 Sending draft to API...')
      const data = await response.json()
      console.log('📨 API Response:', {
        success: data.success,
        error: data.error,
        status: response.status,
        statusText: response.statusText
      })

      if (data.success) {
        console.log('✅ Draft saved successfully!')
        setUploadError(null)
        // Show success message briefly
        const originalError = uploadError
        setUploadError("Draft saved successfully!")
        setTimeout(() => setUploadError(originalError), 3000)
      } else {
        console.error('❌ Draft save failed:', data.error)
        setUploadError(data.error || "Failed to save draft")
      }
    } catch (error) {
      console.error("Error saving draft:", error)
      setUploadError("Failed to save draft")
    } finally {
      setSavingDraft(false)
    }
  }

  // Confetti animation
  const triggerConfetti = () => {
    // Simple confetti using CSS animation
    const confettiContainer = document.createElement('div')
    confettiContainer.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 4rem; animation: confetti 2s ease-out;">🎉</div>
        <div style="position: absolute; top: 40%; left: 30%; transform: translate(-50%, -50%); font-size: 3rem; animation: confetti 2.2s ease-out;">🎊</div>
        <div style="position: absolute; top: 60%; left: 70%; transform: translate(-50%, -50%); font-size: 3rem; animation: confetti 1.8s ease-out;">🎉</div>
      </div>
    `
    document.body.appendChild(confettiContainer)
    setTimeout(() => document.body.removeChild(confettiContainer), 3000)
  }

  // Validation functions
  const validateBasicInfo = () => {
    const required = [formData.title, formData.artist, formData.genre, formData.subGenre, formData.releaseDate, formData.copyrightYear]
    return required.every((field) => field && field.toString().trim() !== "")
  }

  const validateFiles = () => {
    return (
      coverArt !== null &&
      tracks.length > 0 &&
      tracks.every(
        (track) =>
          track.file !== null &&
          track.title.trim() !== "" &&
          track.artist.trim() !== "" &&
          track.mainGenre.trim() !== "" &&
          track.subGenre.trim() !== "",
      )
    )
  }

  const validateDistribution = () => {
    return selectedStores.length > 0
  }

  const canProceedToNext = (currentTab: string) => {
    switch (currentTab) {
      case "basic":
        return validateBasicInfo()
      case "files":
        return validateFiles()
      case "distribution":
        return validateDistribution()
      default:
        return true
    }
  }

  if (uploadSuccess) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen bg-gray-950">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-4 sm:p-6">
              <div className="max-w-2xl mx-auto">
                <Card className="card-dark bg-gray-900/50 border-green-500/30">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                      <Check className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-3">Upload Successful!</h2>
                    <p className="text-gray-300 mb-4 text-lg">
                      Your track "{formData.title}" has been uploaded successfully and is ready for distribution to{" "}
                      {selectedStores.length} platforms across the decentralized network.
                    </p>
                    <p className="text-gray-400 mb-8 text-sm">
                      Redirecting to releases in {redirectCountdown} second{redirectCountdown !== 1 ? 's' : ''}...
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Link href="/releases">
                        <Button className="button-primary">
                          🎵 View My Releases Now
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setUploadSuccess(false)
                          setRedirectCountdown(3)
                          window.location.reload()
                        }} 
                        className="button-secondary"
                      >
                        📤 Upload Another Track
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-2 sm:p-6 pb-20 md:pb-6 content-enter">
            <div className="max-w-6xl mx-auto">
              <div className="mb-4 sm:mb-8 px-2 sm:px-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient mb-2 sm:mb-3">Create Release</h1>
                <p className="text-gray-400 text-sm sm:text-base md:text-lg">Upload your music to the decentralized distribution network</p>
              </div>

              {/* Move tabs to the top for better workflow */}
              {uploadError && (
                <Alert className="mb-6 glass border-rose-500/30">
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                  <AlertDescription className="text-gray-300">{uploadError}</AlertDescription>
                </Alert>
              )}

              <Tabs value={activeTab} onValueChange={(value: string) => {
                // Only allow navigation to steps that are accessible
                const tabs = ["basic", "files", "distribution", "advanced"]
                const currentIndex = tabs.indexOf(activeTab)
                const targetIndex = tabs.indexOf(value)
                
                // Allow backward navigation always
                if (targetIndex <= currentIndex) {
                  setActiveTab(value)
                  return
                }
                
                // For forward navigation, check if all previous steps are complete
                let canNavigate = true
                for (let i = 0; i < targetIndex; i++) {
                  if (!canProceedToNext(tabs[i])) {
                    canNavigate = false
                    break
                  }
                }
                
                if (canNavigate) {
                  setActiveTab(value)
                }
              }} className="space-y-4 sm:space-y-8 px-2 sm:px-0">

                {uploadError && (
                  <Alert className="glass border-red-500/30 bg-red-900/20 mb-4 animate-pulse">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <AlertDescription className="text-gray-100 font-medium text-base">
                      {uploadError}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="mb-6">
                  <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-0 glass border-gray-700/50 bg-gray-800/30 h-auto animate-slide-in-down">
                    <TabsTrigger
                      value="basic"
                      className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gray-500/30 data-[state=active]:text-white text-xs sm:text-sm p-2 sm:p-3 hover-scale press-effect"
                    >
                      <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Basic Info</span>
                      <span className="sm:hidden">Basic</span>
                      {validateBasicInfo() && <span className="ml-1 text-emerald-400">✓</span>}
                    </TabsTrigger>
                    <TabsTrigger
                      value="files"
                      disabled={!validateBasicInfo()}
                      className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gray-500/30 data-[state=active]:text-white data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed text-xs sm:text-sm p-2 sm:p-3 hover-scale press-effect"
                    >
                      <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                      Files
                      {validateFiles() && <span className="ml-1 text-emerald-400">✓</span>}
                    </TabsTrigger>
                    <TabsTrigger
                      value="distribution"
                      disabled={!validateBasicInfo() || !validateFiles()}
                      className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gray-500/30 data-[state=active]:text-white data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed text-xs sm:text-sm p-2 sm:p-3 hover-scale press-effect"
                    >
                      <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Distribution</span>
                      <span className="sm:hidden">Dist</span>
                      {validateDistribution() && <span className="ml-1 text-emerald-400">✓</span>}
                    </TabsTrigger>
                    <TabsTrigger
                      value="advanced"
                      disabled={!validateBasicInfo() || !validateFiles() || !validateDistribution()}
                      className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gray-500/30 data-[state=active]:text-white data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed text-xs sm:text-sm p-2 sm:p-3 hover-scale press-effect"
                    >
                      <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Advanced</span>
                      <span className="sm:hidden">Adv</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="basic" className="space-y-6">
                  {!validateBasicInfo() && (
                    <Alert className="glass border-red-500/30 animate-shake">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-gray-300">
                        Please fill in all required fields in this section.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Card className="card-dark bg-gray-900/50 animate-dissolve-in hover-lift-gentle">
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        Basic Information
                      </CardTitle>
                      <CardDescription className="text-gray-400 text-sm sm:text-base">
                        Enter the essential details about your release
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="title" className="text-gray-200 font-medium">
                            Title <span className="text-red-500">*</span>
                            <span className="text-xs text-gray-400 ml-2">(do not include featured artist)</span>
                          </Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter release title"
                            className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="artist" className="text-gray-200 font-medium">
                            Primary Artist(s) <span className="text-red-500">*</span>
                          </Label>
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              {/* Selected Artists Display */}
                              {selectedArtists.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {selectedArtists.map((artist, index) => (
                                    <Badge 
                                      key={index} 
                                      variant="secondary" 
                                      className="bg-slate-600 text-white hover:bg-slate-700 flex items-center gap-1"
                                    >
                                      {artist}
                                      <X 
                                        className="w-3 h-3 cursor-pointer hover:text-rose-300" 
                                        onClick={() => removeSelectedArtist(artist)}
                                      />
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              
                              <Input
                                id="artist"
                                value={artistInputValue}
                                onChange={(e) => handleArtistInputChange(e.target.value)}
                                onKeyDown={handleArtistInputKeyDown}
                                onFocus={() => {
                                  // Always show suggestions when focused if there are artists available
                                  if (previousArtists.length > 0) {
                                    const filtered = previousArtists.filter(artist => 
                                      !selectedArtists.includes(artist)
                                    )
                                    setFilteredArtists(filtered)
                                    setShowArtistSuggestions(true)
                                  }
                                }}
                                onBlur={() => {
                                  // Delay hiding to allow clicking on suggestions
                                  setTimeout(() => {
                                    setShowArtistSuggestions(false)
                                    setSelectedSuggestionIndex(-1)
                                    // Clear any typed text that wasn't selected
                                    setArtistInputValue("")
                                  }, 150)
                                }}
                                placeholder={selectedArtists.length > 0 ? "Click to add another artist..." : "Click to select artists from dropdown"}
                                className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500 cursor-pointer"
                                autoComplete="off"
                                readOnly
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                <span className="text-red-400">Required:</span> Select from your existing artists or add new via + button
                              </p>
                              
                              {/* Artist Suggestions Dropdown */}
                              {showArtistSuggestions && (
                                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                  {filteredArtists.length > 0 ? (
                                    filteredArtists.slice(0, 5).map((artist, index) => (
                                      <div
                                        key={index}
                                        onClick={() => handleArtistSuggestionSelect(artist)}
                                        className={`px-3 py-2 cursor-pointer border-b border-gray-700 last:border-b-0 ${
                                          index === selectedSuggestionIndex 
                                            ? 'bg-gray-600 text-white' 
                                            : 'hover:bg-gray-700 text-gray-200'
                                        }`}
                                      >
                                        {artist}
                                      </div>
                                    ))
                                  ) : previousArtists.length === 0 ? (
                                    <div className="px-3 py-2 text-gray-400 text-sm">
                                      No artists available. Click the + button to create your first artist.
                                    </div>
                                  ) : (
                                    <div className="px-3 py-2 text-gray-400 text-sm">
                                      All artists already selected.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsAddArtistDialogOpen(true)}
                              className="button-secondary flex-shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="featuredArtist" className="text-gray-200 font-medium">
                            Featured Artist(s)
                          </Label>
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              {/* Selected Featured Artists Display */}
                              {selectedFeaturedArtists.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {selectedFeaturedArtists.map((artist) => (
                                    <span
                                      key={artist}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-200 rounded-md text-sm"
                                    >
                                      {artist}
                                      <button
                                        type="button"
                                        onClick={() => removeSelectedFeaturedArtist(artist)}
                                        className="text-gray-400 hover:text-white"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              <Input
                                id="featuredArtist"
                                value={featuredArtistInputValue}
                                onChange={(e) => handleFeaturedArtistInputChange(e.target.value)}
                                onKeyDown={(e) => {
                                  if (!showFeaturedArtistSuggestions || filteredFeaturedArtists.length === 0) return
                                  
                                  switch (e.key) {
                                    case 'ArrowDown':
                                      e.preventDefault()
                                      setSelectedFeaturedSuggestionIndex((prev) => 
                                        prev < filteredFeaturedArtists.length - 1 ? prev + 1 : prev
                                      )
                                      break
                                    case 'ArrowUp':
                                      e.preventDefault()
                                      setSelectedFeaturedSuggestionIndex((prev) => prev > 0 ? prev - 1 : -1)
                                      break
                                    case 'Enter':
                                      e.preventDefault()
                                      if (selectedFeaturedSuggestionIndex >= 0) {
                                        handleFeaturedArtistSuggestionSelect(filteredFeaturedArtists[selectedFeaturedSuggestionIndex])
                                      }
                                      break
                                    case 'Escape':
                                      setShowFeaturedArtistSuggestions(false)
                                      setSelectedFeaturedSuggestionIndex(-1)
                                      break
                                  }
                                }}
                                onFocus={() => {
                                  // Always show suggestions when focused if there are artists available
                                  if (previousArtists.length > 0) {
                                    const filtered = previousArtists.filter(artist => 
                                      !selectedFeaturedArtists.includes(artist)
                                    )
                                    setFilteredFeaturedArtists(filtered)
                                    setShowFeaturedArtistSuggestions(true)
                                  }
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    setShowFeaturedArtistSuggestions(false)
                                    setSelectedFeaturedSuggestionIndex(-1)
                                    // Clear any typed text that wasn't selected
                                    setFeaturedArtistInputValue("")
                                  }, 150)
                                }}
                                placeholder={selectedFeaturedArtists.length > 0 ? "Click to add another featured artist..." : "Click to select featured artists from dropdown"}
                                className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500 cursor-pointer"
                                autoComplete="off"
                                readOnly
                              />
                              <p className="text-xs text-gray-500 mt-1">Select from existing artists or add new via + button</p>
                              
                              {/* Featured Artist Suggestions Dropdown */}
                              {showFeaturedArtistSuggestions && (
                                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                  {filteredFeaturedArtists.length > 0 ? (
                                    filteredFeaturedArtists.slice(0, 5).map((artist, index) => (
                                      <div
                                        key={index}
                                        onClick={() => handleFeaturedArtistSuggestionSelect(artist)}
                                        className={`px-3 py-2 cursor-pointer border-b border-gray-700 last:border-b-0 ${
                                          index === selectedFeaturedSuggestionIndex 
                                            ? 'bg-gray-600 text-white' 
                                            : 'hover:bg-gray-700 text-gray-200'
                                        }`}
                                      >
                                        {artist}
                                      </div>
                                    ))
                                  ) : previousArtists.length === 0 ? (
                                    <div className="px-3 py-2 text-gray-400 text-sm">
                                      No artists available. Click the + button to create artists first.
                                    </div>
                                  ) : (
                                    <div className="px-3 py-2 text-gray-400 text-sm">
                                      All artists already selected.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsAddFeaturedArtistDialogOpen(true)}
                              className="button-secondary flex-shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lyricist" className="text-gray-200 font-medium">
                            Lyricist <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="lyricist"
                            value={formData.lyricist}
                            onChange={(e) => setFormData((prev) => ({ ...prev, lyricist: e.target.value }))}
                            placeholder="Enter lyricist name"
                            className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="composer" className="text-gray-200 font-medium">
                            Composer
                          </Label>
                          <Input
                            id="composer"
                            value={formData.composer}
                            onChange={(e) => setFormData((prev) => ({ ...prev, composer: e.target.value }))}
                            placeholder="Enter composer name"
                            className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="recordLabel" className="text-gray-200 font-medium">
                            Record Label
                          </Label>
                          <Input
                            id="recordLabel"
                            value={formData.recordLabel}
                            onChange={(e) => setFormData((prev) => ({ ...prev, recordLabel: e.target.value }))}
                            placeholder="Enter record label"
                            className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="displayArtist" className="text-gray-200 font-medium">
                            Display Artist
                          </Label>
                          <Input
                            id="displayArtist"
                            value={formData.displayArtist}
                            onChange={(e) => setFormData((prev) => ({ ...prev, displayArtist: e.target.value }))}
                            placeholder="Alternative artist display name"
                            className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="upc" className="text-gray-200 font-medium">
                            UPC/Barcode
                          </Label>
                          <Input
                            id="upc"
                            value={formData.upc}
                            onChange={(e) => setFormData((prev) => ({ ...prev, upc: e.target.value }))}
                            placeholder="Enter UPC/barcode number"
                            className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="publisher" className="text-gray-200 font-medium">
                            Publisher
                          </Label>
                          <Input
                            id="publisher"
                            value={formData.publisher}
                            onChange={(e) => setFormData((prev) => ({ ...prev, publisher: e.target.value }))}
                            placeholder="Enter publisher name"
                            className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <Label className="text-gray-200 font-medium">Release Type</Label>
                          <Select
                            value={formData.releaseType}
                            onValueChange={(value: string) => setFormData((prev) => ({ ...prev, releaseType: value }))}
                          >
                            <SelectTrigger className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass border-gray-800">
                              {RELEASE_TYPES.map((type) => (
                                <SelectItem
                                  key={type}
                                  value={type.toLowerCase().replace(" ", "-")}
                                  className="text-gray-200"
                                >
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-200 font-medium">Language</Label>
                          <Select
                            value={formData.language}
                            onValueChange={(value: string) => setFormData((prev) => ({ ...prev, language: value }))}
                          >
                            <SelectTrigger className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass border-gray-800 max-h-60">
                              {LANGUAGES.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code} className="text-gray-200">
                                  {lang.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Genre Selection - Primary and Secondary together */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <Label className="text-gray-200 font-medium">Primary Genre <span className="text-red-500">*</span></Label>
                          <Select
                            value={formData.genre}
                            onValueChange={(value: string) => setFormData((prev) => ({ ...prev, genre: value }))}
                          >
                            <SelectTrigger className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500">
                              <SelectValue placeholder="Select primary genre" />
                            </SelectTrigger>
                            <SelectContent className="glass border-gray-800 max-h-60">
                              {MUSIC_GENRES.map((genre) => (
                                <SelectItem key={genre} value={genre.toLowerCase()} className="text-gray-200">
                                  {genre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-200 font-medium">Secondary Genre <span className="text-red-500">*</span></Label>
                          <Select
                            value={formData.subGenre}
                            onValueChange={(value: string) => setFormData((prev) => ({ ...prev, subGenre: value }))}
                          >
                            <SelectTrigger className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500">
                              <SelectValue placeholder="Select secondary genre" />
                            </SelectTrigger>
                            <SelectContent className="glass border-gray-800 max-h-60">
                              {MUSIC_GENRES.map((genre) => (
                                <SelectItem key={genre} value={genre.toLowerCase()} className="text-gray-200">
                                  {genre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <Label className="text-gray-200 font-medium">Release Date <span className="text-red-500">*</span></Label>
                          <Input
                            type="date"
                            value={formData.releaseDate}
                            onChange={(e) => setFormData((prev) => ({ ...prev, releaseDate: e.target.value }))}
                            className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-200 font-medium">Copyright Year <span className="text-red-500">*</span></Label>
                          <Input
                            type="number"
                            value={formData.copyrightYear}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, copyrightYear: Number.parseInt(e.target.value) }))
                            }
                            min="1900"
                            max={new Date().getFullYear() + 1}
                            className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-200 font-medium">Description</Label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe your release..."
                          rows={4}
                          className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500 resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-200 font-medium">Lyrics</Label>
                        <Textarea
                          value={formData.lyrics}
                          onChange={(e) => setFormData((prev) => ({ ...prev, lyrics: e.target.value }))}
                          placeholder="Enter song lyrics (optional)..."
                          rows={8}
                          className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="pLine" className="text-gray-200 font-medium">
                            P Line (Phonographic Copyright)
                          </Label>
                          <Input
                            id="pLine"
                            value={formData.pLine}
                            onChange={(e) => setFormData((prev) => ({ ...prev, pLine: e.target.value }))}
                            placeholder="℗ 2024 Your Label Name"
                            className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cLine" className="text-gray-200 font-medium">
                            C Line (Copyright)
                          </Label>
                          <Input
                            id="cLine"
                            value={formData.cLine}
                            onChange={(e) => setFormData((prev) => ({ ...prev, cLine: e.target.value }))}
                            placeholder="© 2024 Your Name"
                            className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-gray-200 font-medium">Tags</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add a tag..."
                            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                            className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                          />
                          <Button type="button" onClick={addTag} className="button-secondary">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag) => (
                            <Badge
                              key={tag}
                              className="bg-gray-600/20 text-gray-300 border-gray-500/30 flex items-center gap-1"
                            >
                              {tag}
                              <X
                                className="w-3 h-3 cursor-pointer hover:text-gray-100"
                                onClick={() => removeTag(tag)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="files" className="space-y-6">
                  {!validateFiles() && (
                    <Alert className="glass border-red-500/30">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-gray-300">
                        Please upload cover art and at least one track with all required information.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Card className="card-dark bg-gray-900/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                        Cover Art
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Upload cover art (JPG format only, exactly 3000x3000px, max 100MB)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div
                          className="w-40 h-40 flex-shrink-0 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center cursor-pointer hover:border-gray-500/50 transition-all duration-200 glass"
                          onClick={() => coverArtRef.current?.click()}
                        >
                            {coverArtPreview ? (
                            coverArtPreview.startsWith('blob:') ? (
                              // For blob URLs (local file preview), use img tag
                              // eslint-disable-next-line @next/next/no-img-element -- blob URLs can't be used with next/image
                              <img
                                src={coverArtPreview}
                                alt="Cover art"
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              // For remote URLs, use Next.js Image component with optimization
                              <Image
                                src={coverArtPreview}
                                alt="Cover art"
                                className="w-full h-full object-cover rounded-xl"
                                width={160}
                                height={160}
                                priority={false}
                                loading="lazy"
                                placeholder="blur"
                                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyOiMo3HfHY/wBCqQjEbUIwu8C8hNIhg1j3Qk6kgqMdPmSo0qhg=="
                              />
                            )
                          ) : (
                            <div className="text-center">
                              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-sm text-gray-400 font-medium">Click to upload</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <Button onClick={() => coverArtRef.current?.click()} className="button-primary">
                            Choose File
                          </Button>
                          <div className="text-sm text-gray-400 space-y-1">
                            <p>• Format: JPG only</p>
                            <p>• Size: Exactly 3000x3000px (mandatory)</p>
                            <p>• Maximum file size: 100MB</p>
                          </div>
                        </div>
                      </div>
                      <input
                        ref={coverArtRef}
                        type="file"
                        accept="image/jpeg"
                        onChange={handleCoverArtChange}
                        className="hidden"
                      />
                    </CardContent>
                  </Card>

                  <Card className="card-dark bg-gray-900/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Music className="w-5 h-5 text-gray-400" />
                        Audio Tracks
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Upload your audio files (WAV only - 16/24-bit at 44.1/48kHz, max 100MB each)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <Button onClick={() => audioFileRef.current?.click()} className="button-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Tracks
                      </Button>
                      <input
                        ref={audioFileRef}
                        type="file"
                        accept=".wav,audio/wav,audio/wave,audio/x-wav"
                        multiple
                        onChange={handleAudioFileChange}
                        className="hidden"
                      />

                      {tracks.map((track, index) => (
                        <div key={track.id} className="glass rounded-xl p-4 sm:p-6 border border-gray-800/50">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-gray-600/20 to-gray-500/20 rounded-xl flex items-center justify-center border border-gray-600/30">
                                <Music className="w-6 h-6 text-gray-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-white text-lg break-all">{track.title}</p>
                                <p className="text-sm text-gray-400">Track {index + 1}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTrack(track.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </div>

                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-gray-200 font-medium">
                                  Track Title <span className="text-red-500">*</span>
                                  <span className="text-xs text-gray-400 ml-2">(do not include featured artist)</span>
                                </Label>
                                <Input
                                  value={track.title}
                                  onChange={(e) => updateTrack(track.id, { title: e.target.value })}
                                  className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-gray-200 font-medium">Artist <span className="text-red-500">*</span></Label>
                                <Input
                                  value={track.artist}
                                  onChange={(e) => updateTrack(track.id, { artist: e.target.value })}
                                  className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-gray-200 font-medium">Featured Artist</Label>
                                <select
                                  value={track.featuredArtist}
                                  onChange={(e) => updateTrack(track.id, { featuredArtist: e.target.value })}
                                  className="w-full h-10 px-3 bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500 rounded-md"
                                >
                                  <option value="">Select featured artist...</option>
                                  {previousArtists.map((artist) => (
                                    <option key={artist} value={artist}>{artist}</option>
                                  ))}
                                </select>
                                <p className="text-xs text-gray-500">Select from your existing artists</p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-gray-200 font-medium">Lyricist <span className="text-red-500">*</span></Label>
                                <Input
                                  value={track.lyricist}
                                  onChange={(e) => updateTrack(track.id, { lyricist: e.target.value })}
                                  placeholder="Enter lyricist name"
                                  className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-gray-200 font-medium">Main Genre <span className="text-red-500">*</span></Label>
                                <Select
                                  value={track.mainGenre}
                                  onValueChange={(value: string) => updateTrack(track.id, { mainGenre: value })}
                                >
                                  <SelectTrigger className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500">
                                    <SelectValue placeholder="Select main genre" />
                                  </SelectTrigger>
                                  <SelectContent className="glass border-gray-800 max-h-60">
                                    {MUSIC_GENRES.map((genre) => (
                                      <SelectItem key={genre} value={genre.toLowerCase()} className="text-gray-200">
                                        {genre}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-gray-200 font-medium">Sub Genre <span className="text-red-500">*</span></Label>
                                <Select
                                  value={track.subGenre}
                                  onValueChange={(value: string) => updateTrack(track.id, { subGenre: value })}
                                >
                                  <SelectTrigger className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500">
                                    <SelectValue placeholder="Select sub genre" />
                                  </SelectTrigger>
                                  <SelectContent className="glass border-gray-800 max-h-60">
                                    {MUSIC_GENRES.map((genre) => (
                                      <SelectItem key={genre} value={genre.toLowerCase()} className="text-gray-200">
                                        {genre}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-gray-200 font-medium">Composer</Label>
                                <Input
                                  value={track.composer}
                                  onChange={(e) => updateTrack(track.id, { composer: e.target.value })}
                                  placeholder="Enter composer name"
                                  className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-gray-200 font-medium">
                                  Track Duration
                                </Label>
                                <Input
                                  value={`${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}`}
                                  readOnly
                                  className="bg-gray-800/50 text-gray-100 border border-gray-700 cursor-not-allowed"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-gray-200 font-medium">Lyrics</Label>
                              <Textarea
                                value={track.lyrics}
                                onChange={(e) => updateTrack(track.id, { lyrics: e.target.value })}
                                placeholder="Enter track lyrics (optional)..."
                                rows={6}
                                className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500 resize-none"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  id={`explicit-${track.id}`}
                                  checked={track.explicit}
                                  onCheckedChange={(checked: boolean) => updateTrack(track.id, { explicit: !!checked })}
                                  className="border-gray-600 data-[state=checked]:bg-gray-600 data-[state=checked]:border-gray-600"
                                />
                                <Label
                                  htmlFor={`explicit-${track.id}`}
                                  className="text-gray-200 font-medium cursor-pointer"
                                >
                                  Explicit Content
                                </Label>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-gray-200 font-medium">ISRC (Optional)</Label>
                                <Input
                                  value={track.isrc}
                                  onChange={(e) => updateTrack(track.id, { isrc: e.target.value })}
                                  placeholder="US-S1Z-99-00001"
                                  className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="distribution" className="space-y-6">
                  {!validateDistribution() && (
                    <Alert className="glass border-red-500/30">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-gray-300">
                        Please select at least one store for distribution.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Card className="card-dark bg-gray-900/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Globe className="w-5 h-5 text-gray-400" />
                        Music Stores & Platforms
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Choose where you want to distribute your music across the network
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="deliver-new-stores"
                            defaultChecked
                            className="border-gray-600 data-[state=checked]:bg-gray-600 data-[state=checked]:border-gray-600"
                          />
                          <Label htmlFor="deliver-new-stores" className="text-gray-200 font-medium cursor-pointer">
                            Auto-deliver to new platforms
                          </Label>
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleSelectAllStores}
                          className="button-secondary bg-transparent w-full sm:w-auto"
                        >
                          {selectedStores.length === MUSIC_STORES.length ? "Deselect All" : "Select All"}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {[
                          { id: "spotify", name: "Spotify", description: "World's largest music streaming platform" },
                          { id: "apple-music", name: "Apple Music", description: "Premium music streaming service" },
                          {
                            id: "youtube-music",
                            name: "YouTube Music",
                            description: "Google's music streaming platform",
                          },
                          { id: "amazon-music", name: "Amazon Music", description: "Amazon's music streaming service" },
                          { id: "deezer", name: "Deezer", description: "Global music streaming platform" },
                          { id: "tidal", name: "TIDAL", description: "High-fidelity music streaming" },
                          { id: "pandora", name: "Pandora", description: "Personalized music discovery" },
                          { id: "soundcloud", name: "SoundCloud", description: "Audio platform for creators" },
                          { id: "bandcamp", name: "Bandcamp", description: "Platform for independent artists" },
                          { id: "beatport", name: "Beatport", description: "Electronic music marketplace" },
                          { id: "traxsource", name: "Traxsource", description: "Underground dance music" },
                          { id: "juno-download", name: "Juno Download", description: "Digital music store" },
                          { id: "7digital", name: "7digital", description: "Global digital music service" },
                          { id: "qobuz", name: "Qobuz", description: "Hi-res music streaming" },
                          { id: "napster", name: "Napster", description: "Music streaming service" },
                          { id: "iheartradio", name: "iHeartRadio", description: "Digital radio platform" },
                          { id: "shazam", name: "Shazam", description: "Music discovery app" },
                          { id: "anghami", name: "Anghami", description: "Middle East music platform" },
                          { id: "joox", name: "JOOX", description: "Asian music streaming" },
                          { id: "netease", name: "NetEase Cloud Music", description: "Chinese music platform" },
                          { id: "tiktok", name: "TikTok", description: "Short-form video platform" },
                          {
                            id: "facebook-instagram",
                            name: "Facebook/Instagram",
                            description: "Social media platforms",
                          },
                          { id: "twitch", name: "Twitch", description: "Live streaming platform" },
                          { id: "audiomack", name: "Audiomack", description: "Music discovery platform" },
                        ].map((store) => (
                          <div
                            key={store.id}
                            className="glass rounded-lg p-4 border border-gray-800/50 hover:border-gray-500/30 transition-all duration-200"
                          >
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={store.id}
                                checked={selectedStores.includes(store.id)}
                                onCheckedChange={(checked: boolean) => handleStoreChange(store.id, !!checked)}
                                className="border-gray-600 data-[state=checked]:bg-gray-600 data-[state=checked]:border-gray-600"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <Label htmlFor={store.id} className="font-semibold text-white cursor-pointer">
                                    {store.name}
                                  </Label>
                                </div>
                                <p className="text-xs text-gray-400">{store.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="card-dark bg-gray-900/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Globe className="w-5 h-5 text-gray-400" />
                        Global Distribution
                      </CardTitle>
                      <CardDescription className="text-gray-400">Select territories for your release</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-gray-200 font-medium">Distribution Scope</Label>
                        <Select value={selectedCountries.includes("Worldwide") ? "Worldwide" : "custom"}>
                          <SelectTrigger className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass border-gray-800">
                            <SelectItem value="Worldwide" className="text-gray-200">
                              Worldwide Distribution
                            </SelectItem>
                            <SelectItem value="custom" className="text-gray-200">
                              Custom Selection (Coming Soon)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Alert className="glass border-gray-500/30">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <AlertDescription className="text-gray-300">
                          Worldwide distribution includes all major territories and emerging markets across the
                          decentralized network.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6">
                  <Card className="card-dark bg-gray-900/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-gray-400" />
                        Pricing & Quality
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Configure pricing strategy and audio quality
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-gray-200 font-medium">Price Tier</Label>
                        <Select
                          value={formData.priceTier}
                          onValueChange={(value: string) => setFormData((prev) => ({ ...prev, priceTier: value }))}
                        >
                          <SelectTrigger className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass border-gray-800">
                            {(formData.releaseType === "single" 
                              ? SINGLE_PRICE_TIERS 
                              : formData.releaseType === "album" 
                              ? ALBUM_PRICE_TIERS 
                              : SINGLE_PRICE_TIERS // Default to single pricing for EP
                            ).map((tier) => (
                              <SelectItem key={tier.id} value={tier.id} className="text-gray-200">
                                {tier.name} ({tier.description})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.priceTier === "custom" && (
                        <div className="space-y-2">
                          <Label className="text-gray-200 font-medium">Custom Price ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.customPrice}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, customPrice: Number.parseFloat(e.target.value) }))
                            }
                            className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="card-dark bg-gray-900/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Star className="w-5 h-5 text-gray-400" />
                        Professional Services
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Boost your music's reach with our professional marketing services
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <Button
                          onClick={() => setShowProductOfferingsModal(true)}
                          className="bg-white hover:bg-gray-100 text-gray-950 px-8 py-3 text-lg"
                        >
                          <Star className="w-5 h-5 mr-2" />
                          Explore Professional Services
                        </Button>
                        {selectedProducts.length > 0 && (
                          <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                            <p className="text-white font-medium mb-2">
                              {selectedProducts.length} service{selectedProducts.length > 1 ? 's' : ''} selected
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedProducts.map(product => {
                                const services = {
                                  'playlist-pitching': { name: 'Playlist Pitching', price: 99 },
                                  'playlist-influencer': { name: 'Playlist + Influencer', price: 149 },
                                  'label-services': { name: 'Label Services', price: 499 },
                                  'radio-campaign': { name: 'Radio Campaign', price: 299 }
                                }
                                const service = services[product as keyof typeof services]
                                return (
                                  <Badge key={product} className="bg-purple-600 text-white">
                                    {service.name} - ${service.price}
                                  </Badge>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="card-dark bg-gray-900/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-gray-400" />
                        Rights & Licensing
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Manage content rights and licensing options
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="exclusive-rights"
                          checked={hasExclusiveRights}
                          onCheckedChange={(checked: boolean) => setHasExclusiveRights(!!checked)}
                          className="border-gray-600 data-[state=checked]:bg-gray-600 data-[state=checked]:border-gray-600"
                        />
                        <Label htmlFor="exclusive-rights" className="text-gray-200 font-medium">
                          I own exclusive rights to this content
                        </Label>
                      </div>

                      {hasExclusiveRights && (
                        <Alert className="glass border-green-500/30">
                          <Check className="h-4 w-4 text-emerald-400" />
                          <AlertDescription className="text-gray-300">
                            Verified: You can now distribute to TikTok, Facebook/Instagram, and YouTube Content ID.
                          </AlertDescription>
                        </Alert>
                      )}

                      {!hasExclusiveRights &&
                        selectedStores.some((store) => ["tiktok", "facebook-instagram"].includes(store)) && (
                          <Alert className="glass border-yellow-500/30">
                            <AlertCircle className="h-4 w-4 text-yellow-400" />
                            <AlertDescription className="text-gray-300">
                              Some selected platforms require exclusive rights verification.
                            </AlertDescription>
                          </Alert>
                        )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {uploading && (
                <Card className="card-dark bg-gray-900/50 border-gray-500/30 mt-8">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-600/20 to-gray-500/20 rounded-full flex items-center justify-center animate-spin border border-gray-600/30">
                          <Cpu className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="font-semibold text-white">Processing release...</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-200">Upload Progress</span>
                          <span className="text-gray-300 font-medium">{uploadProgress}%</span>
                        </div>
                        <Progress
                          value={uploadProgress}
                          className="w-full bg-gray-800 [&>div]:bg-gradient-to-r [&>div]:from-gray-600 [&>div]:to-gray-500"
                        />
                      </div>
                      <p className="text-sm text-gray-300">
                        {uploadProgress < 25 && "Uploading cover art..."}
                        {uploadProgress >= 25 && uploadProgress < 70 && "Uploading audio files..."}
                        {uploadProgress >= 70 && uploadProgress < 90 && "Creating release record..."}
                        {uploadProgress >= 90 && "Finalizing upload..."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              
              {/* Terms and Conditions */}
              <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="terms" className="text-sm font-medium text-gray-200 cursor-pointer">
                      I accept the{" "}
                      <a
                        href="/terms-of-service"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        Terms of Service
                      </a>
                      {" "}and{" "}
                      <a
                        href="/privacy-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        Privacy Policy
                      </a>
                    </Label>
                    <p className="text-xs text-gray-400 mt-1">
                      By accepting, you confirm that you own all rights to this music and authorize distribution to the selected platforms.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-800/50 gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const tabs = ["basic", "files", "distribution", "advanced"]
                      const currentIndex = tabs.indexOf(activeTab)
                      if (currentIndex > 0) {
                        setActiveTab(tabs[currentIndex - 1])
                      }
                    }}
                    disabled={activeTab === "basic"}
                    className="button-secondary text-sm px-4 py-2 h-10 sm:h-12"
                  >
                    ← Previous
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={savingDraft || uploading}
                    className="button-secondary text-blue-400 border-blue-500/50 hover:bg-blue-500/10 text-sm px-4 py-2 h-10 sm:h-12"
                  >
                    {savingDraft ? (
                      <>
                        <Cpu className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        � Save Draft
                      </>
                    )}
                  </Button>
                </div>

                {activeTab === "advanced" ? (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button
                      onClick={handleSaveDraft}
                      disabled={savingDraft || uploading}
                      variant="outline"
                      className="button-secondary text-sm px-4 py-2 h-10 sm:h-12 w-full sm:w-auto"
                    >
                      {savingDraft ? (
                        <>
                          <Cpu className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Save Draft
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={uploading || savingDraft || !validateBasicInfo() || !validateFiles() || !validateDistribution() || !termsAccepted}
                      className="button-primary text-sm px-4 py-2 h-10 sm:h-12 w-full sm:w-auto"
                    >
                      {uploading ? (
                        <>
                          <Cpu className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Deploy to Network
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      const tabs = ["basic", "files", "distribution", "advanced"]
                      const currentIndex = tabs.indexOf(activeTab)
                      if (currentIndex < tabs.length - 1) {
                        setActiveTab(tabs[currentIndex + 1])
                      }
                    }}
                    disabled={!canProceedToNext(activeTab)}
                    className="button-primary text-sm px-4 py-2 h-10 sm:h-12 w-full sm:w-auto"
                  >
                    Next Step →
                  </Button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      <ExclusiveRightsDialog
        open={showExclusiveDialog}
        onOpenChange={setShowExclusiveDialog}
        onConfirm={(hasRights) => {
          setHasExclusiveRights(hasRights)
          if (hasRights) {
            setSelectedStores((prev) => [...prev, "tiktok", "facebook-instagram"])
          }
        }}
      />

      <Dialog open={isAddArtistDialogOpen} onOpenChange={setIsAddArtistDialogOpen}>
        <DialogContent className="sm:max-w-md card-dark border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Artist</DialogTitle>
            <DialogDescription className="text-gray-400">
              Search for existing artists on Spotify, or add a new artist manually.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-200">
                Search & Select Artist
              </Label>
              <ArtistSearch
                placeholder="Type artist name to search Spotify..."
                onArtistSelect={(artist: ArtistSearchResult) => {
                  setNewArtist({
                    name: artist.name,
                    spotifyUrl: artist.spotifyUrl || "",
                    appleMusicUrl: "",
                    createSpotify: !artist.spotifyUrl,
                    createAppleMusic: true, // Default to true since we removed Apple Music integration
                  })
                }}
              />
            </div>
            
            {/* Manual Entry Section */}
            <div className="border-t border-gray-700/50 pt-4">
              <Label className="text-gray-200 text-sm">
                Or enter manually:
              </Label>
              <div className="space-y-3 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="new-artist-name" className="text-gray-200 text-sm">
                    Artist Name *
                  </Label>
                  <Input
                    id="new-artist-name"
                    value={newArtist.name}
                    onChange={(e) => setNewArtist({ ...newArtist, name: e.target.value })}
                    className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                    placeholder="Enter artist name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spotify-url" className="text-gray-200 text-sm">
                    Spotify Profile URL
                  </Label>
                  <Input
                    id="spotify-url"
                    type="url"
                    value={newArtist.spotifyUrl}
                    onChange={(e) => setNewArtist({ ...newArtist, spotifyUrl: e.target.value })}
                    placeholder="https://open.spotify.com/artist/..."
                    className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                    disabled={newArtist.createSpotify}
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="create-spotify"
                      checked={newArtist.createSpotify}
                      onCheckedChange={(checked: boolean) =>
                        setNewArtist((prev) => ({ ...prev, createSpotify: !!checked, spotifyUrl: "" }))
                      }
                      className="border-gray-600 data-[state=checked]:bg-gray-600 data-[state=checked]:border-gray-600"
                    />
                    <Label
                      htmlFor="create-spotify"
                      className="text-xs text-gray-400 leading-none cursor-pointer"
                    >
                      Artist not on Spotify yet
                    </Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apple-music-url" className="text-gray-200 text-sm">
                    Apple Music Profile URL
                  </Label>
                  <Input
                    id="apple-music-url"
                    type="url"
                    value={newArtist.appleMusicUrl}
                    onChange={(e) => setNewArtist({ ...newArtist, appleMusicUrl: e.target.value })}
                    placeholder="https://music.apple.com/artist/..."
                    className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                    disabled={newArtist.createAppleMusic}
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="create-apple-music"
                      checked={newArtist.createAppleMusic}
                      onCheckedChange={(checked: boolean) =>
                        setNewArtist((prev) => ({ ...prev, createAppleMusic: !!checked, appleMusicUrl: "" }))
                      }
                      className="border-gray-600 data-[state=checked]:bg-gray-600 data-[state=checked]:border-gray-600"
                    />
                    <Label
                      htmlFor="create-apple-music"
                      className="text-xs text-gray-400 leading-none cursor-pointer"
                    >
                      Artist not on Apple Music yet
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddArtistDialogOpen(false)}
              className="button-secondary bg-transparent"
            >
              Cancel
            </Button>
            <Button onClick={handleAddArtist} className="button-primary" disabled={savingArtist}>
              {savingArtist ? "Saving..." : "Save Artist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Featured Artist Dialog */}
      <Dialog open={isAddFeaturedArtistDialogOpen} onOpenChange={setIsAddFeaturedArtistDialogOpen}>
        <DialogContent className="sm:max-w-md card-dark border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add Featured Artist</DialogTitle>
            <DialogDescription className="text-gray-400">
              Search for existing artists on Spotify, or add a new artist manually.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-200">
                Search & Select Artist
              </Label>
              <ArtistSearch
                placeholder="Type artist name to search Spotify..."
                onArtistSelect={(artist: ArtistSearchResult) => {
                  setNewArtist({
                    name: artist.name,
                    spotifyUrl: artist.spotifyUrl || "",
                    appleMusicUrl: "",
                    createSpotify: !artist.spotifyUrl,
                    createAppleMusic: true,
                  })
                }}
              />
            </div>
            
            {/* Manual Entry Section */}
            <div className="border-t border-gray-700/50 pt-4">
              <Label className="text-gray-200 text-sm">
                Or enter manually:
              </Label>
              <div className="space-y-3 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="new-featured-artist-name" className="text-gray-200 text-sm">
                    Artist Name *
                  </Label>
                  <Input
                    id="new-featured-artist-name"
                    value={newArtist.name}
                    onChange={(e) => setNewArtist({ ...newArtist, name: e.target.value })}
                    className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                    placeholder="Enter artist name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="featured-spotify-url" className="text-gray-200 text-sm">
                    Spotify Profile URL
                  </Label>
                  <Input
                    id="featured-spotify-url"
                    type="url"
                    value={newArtist.spotifyUrl}
                    onChange={(e) => setNewArtist({ ...newArtist, spotifyUrl: e.target.value })}
                    placeholder="https://open.spotify.com/artist/..."
                    className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                    disabled={newArtist.createSpotify}
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured-create-spotify"
                      checked={newArtist.createSpotify}
                      onCheckedChange={(checked: boolean) =>
                        setNewArtist((prev) => ({ ...prev, createSpotify: !!checked, spotifyUrl: "" }))
                      }
                      className="border-gray-600 data-[state=checked]:bg-gray-600 data-[state=checked]:border-gray-600"
                    />
                    <Label
                      htmlFor="featured-create-spotify"
                      className="text-xs text-gray-400 leading-none cursor-pointer"
                    >
                      Artist not on Spotify yet
                    </Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="featured-apple-music-url" className="text-gray-200 text-sm">
                    Apple Music Profile URL
                  </Label>
                  <Input
                    id="featured-apple-music-url"
                    type="url"
                    value={newArtist.appleMusicUrl}
                    onChange={(e) => setNewArtist({ ...newArtist, appleMusicUrl: e.target.value })}
                    placeholder="https://music.apple.com/artist/..."
                    className="bg-gray-800/50 text-gray-100 border border-gray-700 focus:border-gray-500"
                    disabled={newArtist.createAppleMusic}
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured-create-apple-music"
                      checked={newArtist.createAppleMusic}
                      onCheckedChange={(checked: boolean) =>
                        setNewArtist((prev) => ({ ...prev, createAppleMusic: !!checked, appleMusicUrl: "" }))
                      }
                      className="border-gray-600 data-[state=checked]:bg-gray-600 data-[state=checked]:border-gray-600"
                    />
                    <Label
                      htmlFor="featured-create-apple-music"
                      className="text-xs text-gray-400 leading-none cursor-pointer"
                    >
                      Artist not on Apple Music yet
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddFeaturedArtistDialogOpen(false)}
              className="button-secondary bg-transparent"
            >
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                // Save the artist using the same function
                await handleAddArtist()
                // After saving, add to featured artists
                if (newArtist.name && !selectedFeaturedArtists.includes(newArtist.name)) {
                  const newSelectedFeaturedArtists = [...selectedFeaturedArtists, newArtist.name]
                  setSelectedFeaturedArtists(newSelectedFeaturedArtists)
                  setFormData((prev) => ({ ...prev, featuredArtist: newSelectedFeaturedArtists.join(' & ') }))
                }
                setIsAddFeaturedArtistDialogOpen(false)
              }} 
              className="button-primary" 
              disabled={savingArtist}
            >
              {savingArtist ? "Saving..." : "Save Featured Artist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Offerings Modal */}
      <ProductOfferingsModal
        isOpen={showProductOfferingsModal}
        onClose={() => setShowProductOfferingsModal(false)}
        selectedServices={selectedProducts}
        onServiceChange={setSelectedProducts}
      />
    </AuthGuard>
  )
}
