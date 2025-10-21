"use client"

import React, { useState } from "react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Wand2, 
  Link, 
  TrendingUp, 
  Crown,
  Star,
  Music2,
  Palette,
  ExternalLink,
  Download,
  Target,
  BarChart,
  Shield,
  Info,
  CheckCircle,
  Zap,
  Award
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

export default function ArtistToolsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("promo")
  const [isGenerating, setIsGenerating] = useState(false)
  const [artworkPrompt, setArtworkPrompt] = useState("")
  const [generatedArtwork, setGeneratedArtwork] = useState<string | null>(null)
  const [publishingOptIn, setPublishingOptIn] = useState(false)
  const [songScanDialogOpen, setSongScanDialogOpen] = useState(false)
  
  // Playlist Pitching State - SIMPLIFIED (no release selection needed)
  const [isPurchasing, setIsPurchasing] = useState(false)
  
  // Promo page state
  const [promoData, setPromoData] = useState({
    title: '',
    bio: '',
    social: {
      spotify: '',
      apple: '',
      youtube: '',
      instagram: '',
      tiktok: ''
    }
  })
  const [isCreating, setIsCreating] = useState(false)

  const pitchingPlans = [
    {
      id: "indie",
      name: "Indie Release",
      price: 99.99,
      icon: Music2,
      color: "from-blue-500 to-cyan-500",
      features: [
        "Promote ALL your releases",
        "Submit to 50+ curated playlists",
        "Genre-specific targeting",
        "Basic campaign reporting",
        "7-day campaign duration",
        "Email support"
      ],
      popular: false
    },
    {
      id: "pro",
      name: "Pro Release", 
      price: 299.99,
      icon: Target,
      color: "from-purple-500 to-pink-500",
      features: [
        "Promote ALL your releases",
        "Submit to 150+ premium playlists",
        "Advanced demographic targeting",
        "Detailed analytics & insights",
        "14-day campaign duration",
        "Priority support",
        "Social media kit included"
      ],
      popular: true
    },
    {
      id: "superstar",
      name: "Superstar",
      price: 499.99,
      icon: Crown,
      color: "from-yellow-400 to-orange-500",
      features: [
        "Promote ALL your releases",
        "Submit to 300+ top-tier playlists",
        "AI-powered audience analysis",
        "Custom campaign strategy",
        "21-day campaign duration",
        "Dedicated account manager",
        "Press release writing",
        "Radio promotion included"
      ],
      popular: false
    }
  ]

  /**
   * Handles the purchase of a playlist pitching plan
   * Creates a Stripe checkout session and redirects the user
   * No release selection required - promotes all releases
   */
// In your artist-tools page.tsx
const handlePurchasePlan = async (planId: string) => {
  if (!user) {
    alert('Please log in to continue')
    return
  }

  setIsPurchasing(true)

  try {
    console.log('🎯 Creating checkout session...', { planId, userId: user.id })
    
    // The cookies will be automatically sent with the request
    // because we're using the SSR-compatible client
    const response = await fetch('/api/artist-tools/create-playlist-campaign', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Important: ensures cookies are sent
      body: JSON.stringify({ planId })
    })
    
    const data = await response.json()
    
    if (data.success && data.checkoutUrl) {
      console.log('✅ Checkout session created, redirecting to Stripe...')
      window.location.href = data.checkoutUrl
    } else {
      console.error('❌ Failed to create checkout:', data.error)
      alert(data.error || 'Failed to create checkout session. Please try again.')
    }
  } catch (error) {
    console.error('❌ Error purchasing plan:', error)
    alert('Error processing purchase. Please try again.')
  } finally {
    setIsPurchasing(false)
  }
}

  /**
   * Generates AI artwork using the PixArt-Sigma model
   * Takes the user's prompt and creates 3000x3000px artwork
   */
  const handleGenerateArtwork = async () => {
    if (!artworkPrompt.trim()) return
    
    setIsGenerating(true)
    console.log('🎨 Starting AI artwork generation...')
    
    try {
      const response = await fetch('/api/artwork/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: artworkPrompt })
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Artwork generated:', data.message)
        setGeneratedArtwork(data.imageUrl)
        
        if (data.message) {
          console.log('ℹ️ Generation method:', data.message)
        }
      } else {
        console.error('❌ Artwork generation failed:', data.error)
        alert('Failed to generate artwork: ' + (data.error || 'Unknown error'))
      }
      
    } catch (error) {
      console.error('❌ Artwork generation request failed:', error)
      alert('Failed to generate artwork. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * Downloads the generated artwork to the user's device
   * Fallback to opening in new tab if download fails
   */
  const handleDownloadArtwork = () => {
    if (!generatedArtwork) return
    
    try {
      const link = document.createElement('a')
      link.href = generatedArtwork
      link.download = `artwork-${artworkPrompt.slice(0, 20)}-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download failed:', error)
      window.open(generatedArtwork, '_blank')
    }
  }

  /**
   * Creates a promotional landing page with all release links
   * Saves to database and opens in new tab
   */
  const handleCreatePromoPage = async () => {
    if (!user || !supabase) {
      alert('Please log in to create a promo page')
      return
    }

    if (!promoData.title.trim()) {
      alert('Please enter a title for your promo page')
      return
    }

    setIsCreating(true)
    console.log('🎵 Creating promo page...', promoData)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        alert('Please log in to continue')
        setIsCreating(false)
        return
      }

      console.log('📡 Sending request to create promo page API...')
      const response = await fetch('/api/promo/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(promoData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API error:', response.status, errorText)
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ API response:', result)

      if (result.success) {
        console.log('✅ Promo page created:', result.url)
        
        let pageUrl = result.fullUrl || result.url
        
        if (!pageUrl.startsWith('http://') && !pageUrl.startsWith('https://')) {
          pageUrl = `http://${pageUrl}`
        }
        
        console.log('🔗 Opening URL:', pageUrl)
        window.open(pageUrl, '_blank', 'noopener,noreferrer')
        
        // Reset form
        setPromoData({
          title: '',
          bio: '',
          social: {
            spotify: '',
            apple: '',
            youtube: '',
            instagram: '',
            tiktok: ''
          }
        })

        alert(`Promo page created successfully! Opening in new tab: ${pageUrl}`)
      } else {
        console.error('❌ API returned error:', result)
        alert(`Error: ${result.error || 'Failed to create promo page'}. Details: ${result.details || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Request failed:', error)
      alert(`Failed to create promo page: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSongScanRequest = () => {
    setSongScanDialogOpen(true)
  }

  const handleSongScanSubmit = () => {
    window.open('https://luminatedata.com/song-title-registration/', '_blank')
    setSongScanDialogOpen(false)
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 mobile-safe-area">
              
              {/* Hero Section */}
              <div className="relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-cyan-500/20" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="relative p-4 sm:p-6 md:p-8 text-center">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                    Artist Tools Suite
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-4 sm:mb-6 md:mb-8 px-2">
                    Everything you need to promote, distribute, and monetize your music like a pro
                  </p>
                </div>
              </div>

              {/* Tools Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-gray-900 border border-gray-800 h-auto">
                  <TabsTrigger value="promo" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
                    <Link className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Promo Page</span>
                    <span className="sm:hidden">Promo</span>
                  </TabsTrigger>
                  <TabsTrigger value="artwork" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
                    <Palette className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">AI Artwork</span>
                    <span className="sm:hidden">Artwork</span>
                  </TabsTrigger>
                  <TabsTrigger value="pitching" className="data-[state=active]:bg-green-600 data-[state=active]:text-white flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden lg:inline">Playlist Pitching</span>
                    <span className="lg:hidden">Pitching</span>
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden lg:inline">Charts Registration</span>
                    <span className="lg:hidden">Charts</span>
                  </TabsTrigger>
                  <TabsTrigger value="publishing" className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden lg:inline">Publishing Admin</span>
                    <span className="lg:hidden">Publishing</span>
                  </TabsTrigger>
                </TabsList>

                {/* Promo Page Creator */}
                <TabsContent value="promo" className="space-y-6">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/20 rounded-lg">
                          <Link className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <CardTitle className="text-white">Linkly Promo Page Creator</CardTitle>
                          <CardDescription className="text-gray-400">
                            Create a professional promo page with all your release links in one place
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="title" className="text-white">Release Title *</Label>
                            <Input
                              id="title"
                              placeholder="Enter your release title"
                              value={promoData.title}
                              onChange={(e) => setPromoData({...promoData, title: e.target.value})}
                              className="bg-gray-800 border-gray-700 text-white mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="bio" className="text-white">Artist Bio</Label>
                            <Textarea
                              id="bio"
                              placeholder="Tell your story..."
                              value={promoData.bio}
                              onChange={(e) => setPromoData({...promoData, bio: e.target.value})}
                              className="bg-gray-800 border-gray-700 text-white mt-2 min-h-[100px] sm:min-h-[120px]"
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-white font-semibold">Streaming & Social Links</h3>
                          {Object.entries(promoData.social).map(([platform, url]) => (
                            <div key={platform}>
                              <Label htmlFor={platform} className="text-gray-300 capitalize">{platform}</Label>
                              <Input
                                id={platform}
                                placeholder={`Your ${platform} URL`}
                                value={url as string}
                                onChange={(e) => setPromoData({
                                  ...promoData, 
                                  social: {...promoData.social, [platform]: e.target.value}
                                })}
                                className="bg-gray-800 border-gray-700 text-white mt-1"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          onClick={handleCreatePromoPage} 
                          disabled={isCreating || !promoData.title.trim()}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isCreating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Create & Open Promo Page
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* AI Artwork Generator */}
                <TabsContent value="artwork" className="space-y-6">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-600/20 rounded-lg">
                          <Wand2 className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <CardTitle className="text-white">AI Artwork Generator</CardTitle>
                          <CardDescription className="text-gray-400">
                            Generate stunning 3000x3000px artwork using PixArt-Sigma AI
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="prompt" className="text-white">Artwork Description</Label>
                            <Textarea
                              id="prompt"
                              placeholder="Describe your ideal artwork... e.g., 'cyberpunk cityscape with neon lights, synthwave aesthetic, vibrant purple and blue colors'"
                              value={artworkPrompt}
                              onChange={(e) => setArtworkPrompt(e.target.value)}
                              className="bg-gray-800 border-gray-700 text-white mt-2 min-h-[100px] sm:min-h-[120px]"
                            />
                          </div>
                          <Alert className="bg-purple-900/20 border-purple-800">
                            <Info className="h-4 w-4 text-purple-400" />
                            <AlertDescription className="text-purple-200 text-sm">
                              Be specific about colors, style, mood, and visual elements for best results
                            </AlertDescription>
                          </Alert>
                          <Button 
                            onClick={handleGenerateArtwork}
                            disabled={isGenerating || !artworkPrompt.trim()}
                            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                          >
                            {isGenerating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-4 h-4 mr-2" />
                                Generate Artwork
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="space-y-4">
                          <Label className="text-white">Generated Artwork</Label>
                          <div className="aspect-square bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center">
                            {generatedArtwork ? (
                              <div className="relative w-full h-full">
                                <Image 
                                  src={generatedArtwork} 
                                  alt="Generated artwork" 
                                  className="w-full h-full object-cover rounded-lg"
                                  width={3000}
                                  height={3000}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={handleDownloadArtwork}
                                    className="bg-white/20 hover:bg-white/30"
                                  >
                                    <Download className="w-4 h-4 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 p-4">
                                <Palette className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm sm:text-base">Your generated artwork will appear here</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Playlist Pitching - UPDATED (No Release Selection) */}
                <TabsContent value="pitching" className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Playlist Pitching Plans</h2>
                    <p className="text-gray-400">Promote ALL your releases to our curated playlist network</p>
                  </div>

                  {/* Info Alert - Updated messaging */}
                  <Alert className="bg-blue-900/20 border-blue-800">
                    <Info className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-200">
                      <strong>All-Inclusive Campaigns:</strong> Each plan promotes ALL your current and future releases during the campaign period. No need to select individual tracks!
                    </AlertDescription>
                  </Alert>
                  
                  {/* Pricing Plans - Simplified */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {pitchingPlans.map((plan) => (
                      <Card key={plan.id} className={`relative bg-gray-900 border-2 transition-all hover:scale-105 border-gray-800 ${
                        plan.popular ? 'ring-2 ring-purple-500/50' : ''
                      }`}>
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 sm:px-3 py-1 text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Most Popular
                            </Badge>
                          </div>
                        )}
                        <CardHeader className="text-center pb-3 sm:pb-4">
                          <div className={`mx-auto p-2 sm:p-3 rounded-full bg-gradient-to-r ${plan.color} w-fit mb-3 sm:mb-4`}>
                            <plan.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                          </div>
                          <CardTitle className="text-white text-lg sm:text-xl">{plan.name}</CardTitle>
                          <div className="text-2xl sm:text-3xl font-bold text-white">
                            ${plan.price}
                            <span className="text-sm sm:text-lg text-gray-400 font-normal">/campaign</span>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4">
                          <ul className="space-y-2 sm:space-y-3">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-300">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <Button 
                            className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-sm sm:text-base disabled:opacity-50`}
                            onClick={() => handlePurchasePlan(plan.id)}
                            disabled={isPurchasing}
                          >
                            {isPurchasing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Target className="w-4 h-4 mr-2" />
                                Start Campaign
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Updated Info Section */}
                  <Alert className="bg-green-900/20 border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-200">
                      <strong>How it works:</strong> Choose a plan and we'll promote ALL your catalog to our network of curators. You'll receive detailed reports on playlist placements and streaming performance for all your releases.
                    </AlertDescription>
                  </Alert>
                </TabsContent>

                {/* Charts Registration */}
                <TabsContent value="charts" className="space-y-6">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-600/20 rounded-lg">
                          <Award className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                          <CardTitle className="text-white">Nielsen SongScan Charts Registration</CardTitle>
                          <CardDescription className="text-gray-400">
                            Register your releases for chart eligibility and tracking
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <Alert className="bg-yellow-900/20 border-yellow-800">
                        <TrendingUp className="h-4 w-4 text-yellow-400" />
                        <AlertDescription className="text-yellow-200">
                          Each release requires a separate registration. This enables tracking for Billboard, iTunes, and other major charts.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-2">What&apos;s Included:</h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Billboard Chart eligibility
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            iTunes Charts tracking
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            SoundScan sales reporting
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Weekly chart position updates
                          </li>
                        </ul>
                      </div>

                      <Button onClick={handleSongScanRequest} className="bg-yellow-600 hover:bg-yellow-700">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Request SongScan Registration
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Publishing Administration */}
                <TabsContent value="publishing" className="space-y-6">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-600/20 rounded-lg">
                          <Shield className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                          <CardTitle className="text-white">Publishing Administration</CardTitle>
                          <CardDescription className="text-gray-400">
                            Maximize your royalty collection and protect your publishing rights
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <Alert className="bg-blue-900/20 border-blue-800">
                        <Info className="h-4 w-4 text-blue-400" />
                        <AlertDescription className="text-blue-200">
                          <strong>What is Publishing Administration?</strong><br />
                          Publishing administration helps you collect mechanical royalties, performance royalties, and sync fees from around the world. We handle the paperwork and ensure you get paid for every use of your music.
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                            What We Handle
                          </h3>
                          <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                              Worldwide royalty collection
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                              PRO registration & management
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                              Mechanical rights administration
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                              Sync licensing opportunities
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                              Copyright protection
                            </li>
                          </ul>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <BarChart className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                            Pricing Structure
                          </h3>
                          <div className="space-y-3 text-xs sm:text-sm">
                            <div className="flex justify-between items-center text-gray-300">
                              <span>Administration Fee</span>
                              <span className="font-semibold text-white">15%</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-300">
                              <span>Setup Fee</span>
                              <span className="font-semibold text-green-400">Free</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-300">
                              <span>Monthly Fee</span>
                              <span className="font-semibold text-green-400">$0</span>
                            </div>
                            <div className="border-t border-gray-700 pt-2 mt-3">
                              <div className="flex justify-between items-center text-white font-semibold">
                                <span>You Keep</span>
                                <span>85%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-4 bg-gray-800 rounded-lg">
                        <Switch
                          id="publishing-opt-in"
                          checked={publishingOptIn}
                          onCheckedChange={setPublishingOptIn}
                        />
                        <Label htmlFor="publishing-opt-in" className="text-white cursor-pointer">
                          Enable Publishing Administration for my releases
                        </Label>
                      </div>

                      {publishingOptIn && (
                        <Alert className="bg-green-900/20 border-green-800">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <AlertDescription className="text-green-200">
                            Great! Publishing administration will be activated for your account. We&apos;ll start collecting royalties for all your eligible releases.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-3">
                        <Button 
                          disabled={!publishingOptIn}
                          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Activate Publishing Admin
                        </Button>
                        <Button variant="outline" className="border-gray-600 text-gray-300">
                          Learn More
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

            </div>
          </main>
        </div>
      </div>

      {/* SongScan Registration Dialog */}
      <Dialog open={songScanDialogOpen} onOpenChange={setSongScanDialogOpen}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Award className="w-5 h-5 text-yellow-400" />
              Luminate Song Title Registration
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Register your songs with Luminate for chart eligibility tracking
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">What you'll get:</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Billboard Chart eligibility
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  iTunes Charts tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  SoundScan sales reporting
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Official chart position tracking
                </li>
              </ul>
            </div>
            
            <Alert className="bg-blue-900/20 border-blue-800">
              <Info className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200">
                You'll be redirected to Luminate's official song registration page to complete your submission.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setSongScanDialogOpen(false)}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSongScanSubmit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Go to Luminate Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  )
}