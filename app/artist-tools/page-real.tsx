"use client"

import React, { useState, useEffect, useCallback } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Music2, Info, Palette } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

export default function ArtistToolsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("promo")
  const [isGenerating, setIsGenerating] = useState(false)
  const [artworkPrompt, setArtworkPrompt] = useState("")
  const [generatedArtwork, setGeneratedArtwork] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState("")
  const [publishingOptIn, setPublishingOptIn] = useState(false)
  const [releases, setReleases] = useState<any[]>([])
  const [selectedRelease, setSelectedRelease] = useState("")
  const [selectedCampaignRelease, setSelectedCampaignRelease] = useState("")
  const [loading, setLoading] = useState(false)
  const [promoPageData, setPromoPageData] = useState({
    title: "",
    bio: "",
    social: {
      spotify: "",
      apple: "",
      youtube: "",
      instagram: "",
      tiktok: ""
    }
  })

  const pitchingPlans = [
    {
      id: "indie",
      name: "Indie Release",
      price: 99.99,
      features: [
        "Submit to 50+ curated playlists",
        "Genre-specific targeting", 
        "Basic campaign reporting"
      ]
    },
    {
      id: "pro",
      name: "Pro Release", 
      price: 299.99,
      features: [
        "Submit to 150+ premium playlists",
        "Advanced demographic targeting",
        "Detailed analytics & insights"
      ],
      popular: true
    },
    {
      id: "superstar",
      name: "Superstar",
      price: 499.99,
      features: [
        "Submit to 300+ top-tier playlists",
        "AI-powered audience analysis", 
        "Custom campaign strategy"
      ]
    }
  ]

  const fetchReleases = useCallback(async () => {
    if (!user || !supabase) return
    
    try {
      // Get the session token for authorization
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('No access token available')
        return
      }

      const response = await fetch('/api/artist-tools/get-releases', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setReleases(data.releases)
      }
    } catch (error) {
      console.error('Error fetching releases:', error)
    }
  }, [user])

  // Fetch releases on component mount
  useEffect(() => {
    fetchReleases()
  }, [fetchReleases])

  const handleGenerateArtwork = async () => {
    if (!artworkPrompt.trim()) return
    
    setIsGenerating(true)
    try {
      const response = await fetch('/api/artist-tools/generate-artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: artworkPrompt })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setGeneratedArtwork(data.imageUrl)
      } else {
        console.error('Error generating artwork:', data.error)
        alert('Error generating artwork: ' + data.error)
      }
      
    } catch (error) {
      console.error('Error generating artwork:', error)
      alert('Error generating artwork')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreatePromoPage = async () => {
    try {
      const response = await fetch('/api/artist-tools/create-promo-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promoPageData)
      })
      const data = await response.json()
      
      if (data.success) {
        alert(`Promo page created! View at: ${data.url}`)
      } else {
        alert('Error creating promo page: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating promo page:', error)
      alert('Error creating promo page')
    }
  }

  const handleSongScanRequest = async (releaseId: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/artist-tools/request-songscan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releaseId })
      })
      const data = await response.json()
      
      if (data.success) {
        alert('SongScan registration request submitted successfully!')
      } else {
        alert(data.error || 'Failed to submit request')
      }
    } catch (error) {
      console.error('Error requesting SongScan:', error)
      alert('Error submitting request')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchasePlan = async (planId: string) => {
    if (!selectedCampaignRelease) {
      alert('Please select a release for the campaign')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/artist-tools/create-playlist-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, releaseId: selectedCampaignRelease })
      })
      
      const data = await response.json()
      
      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        alert(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error purchasing plan:', error)
      alert('Error processing purchase')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950">
            <div className="max-w-7xl mx-auto p-6 space-y-8">
              
              {/* Hero Section */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <Music2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-gray-400 uppercase tracking-wide">Artist Tools</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">
                  Artist Tools
                </h1>
                <p className="text-gray-400">
                  Tools to help promote and manage your music releases
                </p>
              </div>

              {/* Tools Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-gray-900 border border-gray-800 rounded-lg">
                  <TabsTrigger value="promo" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-sm">
                    Promo Page
                  </TabsTrigger>
                  <TabsTrigger value="artwork" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-sm">
                    AI Art
                  </TabsTrigger>
                  <TabsTrigger value="pitching" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-sm">
                    Playlists
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white text-sm">
                    Charts
                  </TabsTrigger>
                  <TabsTrigger value="publishing" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-sm">
                    Publishing
                  </TabsTrigger>
                </TabsList>

                {/* Promo Page Creator */}
                <TabsContent value="promo" className="space-y-6">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-white text-lg">Create Promo Page</CardTitle>
                      <CardDescription className="text-gray-400">
                        Make a link page for your release with all streaming links
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="title" className="text-white">Release Title</Label>
                            <Input
                              id="title"
                              placeholder="Enter your release title"
                              value={promoPageData.title}
                              onChange={(e) => setPromoPageData({...promoPageData, title: e.target.value})}
                              className="bg-gray-800 border-gray-700 text-white mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="bio" className="text-white">Artist Bio</Label>
                            <Textarea
                              id="bio"
                              placeholder="Tell your story..."
                              value={promoPageData.bio}
                              onChange={(e) => setPromoPageData({...promoPageData, bio: e.target.value})}
                              className="bg-gray-800 border-gray-700 text-white mt-2 min-h-[120px]"
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-white font-semibold">Streaming & Social Links</h3>
                          {Object.entries(promoPageData.social).map(([platform, url]) => (
                            <div key={platform}>
                              <Label htmlFor={platform} className="text-gray-300 capitalize">{platform}</Label>
                              <Input
                                id={platform}
                                placeholder={`Your ${platform} URL`}
                                value={url}
                                onChange={(e) => setPromoPageData({
                                  ...promoPageData, 
                                  social: {...promoPageData.social, [platform]: e.target.value}
                                })}
                                className="bg-gray-800 border-gray-700 text-white mt-1"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={handleCreatePromoPage} className="bg-blue-600 hover:bg-blue-700">
                          Create Page
                        </Button>
                        <Button variant="outline" className="border-gray-600 text-gray-300">
                          Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* AI Artwork Generator */}
                <TabsContent value="artwork" className="space-y-6">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-white text-lg">AI Artwork Generator</CardTitle>
                      <CardDescription className="text-gray-400">
                        Generate cover art using AI (1024x1024px)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="prompt" className="text-white">Artwork Description</Label>
                            <Textarea
                              id="prompt"
                              placeholder="Describe your ideal artwork... e.g., 'cyberpunk cityscape with neon lights, synthwave aesthetic'"
                              value={artworkPrompt}
                              onChange={(e) => setArtworkPrompt(e.target.value)}
                              className="bg-gray-800 border-gray-700 text-white mt-2 min-h-[120px]"
                            />
                          </div>
                          <Alert className="bg-gray-800 border-gray-700">
                            <Info className="h-4 w-4 text-gray-400" />
                            <AlertDescription className="text-gray-300">
                              Describe what you want the artwork to look like
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
                              "Generate Artwork"
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
                                  width={1024}
                                  height={1024}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <Button size="sm" className="bg-white/20 hover:bg-white/30">
                                    Download
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-gray-500">
                                <Palette className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Your generated artwork will appear here</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Playlist Pitching */}
                <TabsContent value="pitching" className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-white mb-2">Playlist Pitching</h2>
                    <p className="text-gray-400">Submit your music to playlist curators</p>
                  </div>

                  <div className="mb-6">
                    <Label htmlFor="campaign-release-select" className="text-white">Select Release for Campaign</Label>
                    <Select value={selectedCampaignRelease} onValueChange={setSelectedCampaignRelease}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                        <SelectValue placeholder="Choose a release for pitching" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {releases.map((release) => (
                          <SelectItem key={release.id} value={release.id} className="text-white">
                            {release.title} by {release.artist_name}
                          </SelectItem>
                        ))}
                        {releases.length === 0 && (
                          <SelectItem value="none" disabled className="text-gray-500">
                            No releases found
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    {pitchingPlans.map((plan) => (
                      <Card key={plan.id} className={`bg-gray-900 border transition-all hover:border-gray-600 ${
                        selectedPlan === plan.id ? 'border-purple-500 ring-1 ring-purple-500' : 'border-gray-800'
                      }`}>
                        {plan.popular && (
                          <div className="bg-purple-600 text-white text-center py-1 text-sm font-medium rounded-t-lg">
                            Most Popular
                          </div>
                        )}
                        <CardHeader className="text-center pb-2">
                          <CardTitle className="text-white text-lg">{plan.name}</CardTitle>
                          <div className="text-2xl font-bold text-white">
                            ${plan.price}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 p-4">
                          <ul className="space-y-2 text-sm text-gray-300">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-green-500 text-xs mt-1">✓</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            onClick={() => handlePurchasePlan(plan.id)}
                            disabled={!selectedCampaignRelease || loading}
                          >
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Processing...
                              </>
                            ) : (
                              "Purchase Plan"
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Charts Registration */}
                <TabsContent value="charts" className="space-y-6">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-white text-lg">Charts Registration</CardTitle>
                      <CardDescription className="text-gray-400">
                        Register releases for Billboard and other chart tracking
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-3">
                        <p className="text-yellow-200 text-sm">
                          Register each release separately for chart tracking
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="release-select" className="text-white">Select Release</Label>
                        <Select value={selectedRelease} onValueChange={setSelectedRelease}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                            <SelectValue placeholder="Choose a release" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {releases.map((release) => (
                              <SelectItem key={release.id} value={release.id} className="text-white">
                                {release.title} by {release.artist_name}
                              </SelectItem>
                            ))}
                            {releases.length === 0 && (
                              <SelectItem value="none" disabled className="text-gray-500">
                                No releases found
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 text-sm text-gray-300">
                        <p className="font-semibold text-white">Includes:</p>
                        <div className="pl-4">
                          <p>• Billboard Chart eligibility</p>
                          <p>• iTunes Charts tracking</p>
                          <p>• Weekly position updates</p>
                        </div>
                      </div>

                      <Button 
                        onClick={() => handleSongScanRequest(selectedRelease)} 
                        disabled={!selectedRelease || loading}
                        className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Processing...
                          </>
                        ) : (
                          "Request Registration"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Publishing Administration */}
                <TabsContent value="publishing" className="space-y-6">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-white text-lg">Publishing Administration</CardTitle>
                      <CardDescription className="text-gray-400">
                        Collect royalties worldwide and protect your music rights
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
                        <p className="text-blue-200 text-sm mb-2">
                          <strong>What is Publishing Administration?</strong>
                        </p>
                        <p className="text-blue-200 text-sm">
                          We collect mechanical royalties, performance royalties, and sync fees from around the world. We handle the paperwork so you get paid for every use of your music.
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gray-800 rounded-lg p-4">
                          <h3 className="text-white font-semibold mb-3">What We Handle</h3>
                          <div className="space-y-1 text-sm text-gray-300">
                            <p>• Worldwide royalty collection</p>
                            <p>• PRO registration & management</p>
                            <p>• Mechanical rights administration</p>
                            <p>• Copyright protection</p>
                          </div>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-4">
                          <h3 className="text-white font-semibold mb-3">Pricing</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-300">
                              <span>Administration Fee</span>
                              <span className="font-semibold text-white">15%</span>
                            </div>
                            <div className="flex justify-between text-gray-300">
                              <span>Setup Fee</span>
                              <span className="font-semibold text-green-400">Free</span>
                            </div>
                            <div className="border-t border-gray-700 pt-2 mt-2">
                              <div className="flex justify-between text-white font-semibold">
                                <span>You Keep</span>
                                <span>85%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                        <Switch
                          id="publishing-opt-in"
                          checked={publishingOptIn}
                          onCheckedChange={setPublishingOptIn}
                        />
                        <Label htmlFor="publishing-opt-in" className="text-white cursor-pointer text-sm">
                          Enable Publishing Administration for my releases
                        </Label>
                      </div>

                      {publishingOptIn && (
                        <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-3">
                          <p className="text-green-200 text-sm">
                            Publishing administration will be activated for your account. We&apos;ll start collecting royalties for all your eligible releases.
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button 
                          disabled={!publishingOptIn}
                          className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          Activate Publishing
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
    </AuthGuard>
  )
}
