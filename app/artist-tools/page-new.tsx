"use client"

import React, { useState } from "react"
import { useAuth } from "@/lib/auth"
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
  Upload,
  Sparkles,
  Target,
  BarChart,
  Shield,
  Info,
  CheckCircle,
  Zap,
  Headphones,
  Award
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
      icon: Music2,
      color: "from-blue-500 to-cyan-500",
      features: [
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

  const handleGenerateArtwork = async () => {
    if (!artworkPrompt.trim()) return
    
    setIsGenerating(true)
    try {
      // Simulate API call to Hugging Face PixArt-Sigma
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // For demo purposes, we'll use a placeholder
      setGeneratedArtwork(`https://picsum.photos/3000/3000?random=${Date.now()}`)
      
      // In production, you would call:
      // const response = await fetch('/api/generate-artwork', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ prompt: artworkPrompt })
      // })
      // const data = await response.json()
      // setGeneratedArtwork(data.imageUrl)
      
    } catch (error) {
      console.error('Error generating artwork:', error)
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
        // Show success message and link to page
        alert(`Promo page created! View at: ${data.url}`)
      }
    } catch (error) {
      console.error('Error creating promo page:', error)
    }
  }

  const handleSongScanRequest = async (releaseId: string) => {
    try {
      const response = await fetch('/api/artist-tools/request-songscan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releaseId })
      })
      const data = await response.json()
      
      if (data.success) {
        alert('SongScan registration request submitted successfully!')
      }
    } catch (error) {
      console.error('Error requesting SongScan:', error)
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
              <div className="relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-cyan-500/20" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="relative p-8 text-center">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-white">Professional Artist Tools</span>
                  </div>
                  <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                    Artist Tools Suite
                  </h1>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                    Everything you need to promote, distribute, and monetize your music like a pro
                  </p>
                </div>
              </div>

              {/* Tools Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-gray-900 border border-gray-800">
                  <TabsTrigger value="promo" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Link className="w-4 h-4 mr-2" />
                    Promo Page
                  </TabsTrigger>
                  <TabsTrigger value="artwork" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                    <Palette className="w-4 h-4 mr-2" />
                    AI Artwork
                  </TabsTrigger>
                  <TabsTrigger value="pitching" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                    <Target className="w-4 h-4 mr-2" />
                    Playlist Pitching
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Charts Registration
                  </TabsTrigger>
                  <TabsTrigger value="publishing" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    <Shield className="w-4 h-4 mr-2" />
                    Publishing Admin
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
                          <CardTitle className="text-white">LinkStack Promo Page Creator</CardTitle>
                          <CardDescription className="text-gray-400">
                            Create a professional promo page with all your release links in one place
                          </CardDescription>
                        </div>
                      </div>
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
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Create Promo Page
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
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="prompt" className="text-white">Artwork Description</Label>
                            <Textarea
                              id="prompt"
                              placeholder="Describe your ideal artwork... e.g., 'cyberpunk cityscape with neon lights, synthwave aesthetic, vibrant purple and blue colors'"
                              value={artworkPrompt}
                              onChange={(e) => setArtworkPrompt(e.target.value)}
                              className="bg-gray-800 border-gray-700 text-white mt-2 min-h-[120px]"
                            />
                          </div>
                          <Alert className="bg-purple-900/20 border-purple-800">
                            <Info className="h-4 w-4 text-purple-400" />
                            <AlertDescription className="text-purple-200">
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
                                  <Button size="sm" className="bg-white/20 hover:bg-white/30">
                                    <Download className="w-4 h-4 mr-1" />
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
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Playlist Pitching Plans</h2>
                    <p className="text-gray-400">Get your music heard by the right audience with our curated playlist network</p>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {pitchingPlans.map((plan) => (
                      <Card key={plan.id} className={`relative bg-gray-900 border-2 transition-all hover:scale-105 ${
                        selectedPlan === plan.id ? 'border-purple-500' : 'border-gray-800'
                      } ${plan.popular ? 'ring-2 ring-purple-500/50' : ''}`}>
                        {plan.popular && (
                          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1">
                              <Star className="w-3 h-3 mr-1" />
                              Most Popular
                            </Badge>
                          </div>
                        )}
                        <CardHeader className="text-center pb-4">
                          <div className={`mx-auto p-3 rounded-full bg-gradient-to-r ${plan.color} w-fit mb-4`}>
                            <plan.icon className="w-8 h-8 text-white" />
                          </div>
                          <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                          <div className="text-3xl font-bold text-white">
                            ${plan.price}
                            <span className="text-lg text-gray-400 font-normal">/campaign</span>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <ul className="space-y-3">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-300">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <Button 
                            className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90`}
                            onClick={() => setSelectedPlan(plan.id)}
                          >
                            Select Plan
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
                      
                      <div>
                        <Label htmlFor="release-select" className="text-white">Select Release for Registration</Label>
                        <Select>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                            <SelectValue placeholder="Choose a release" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="release1" className="text-white">My Latest Single</SelectItem>
                            <SelectItem value="release2" className="text-white">Album Name</SelectItem>
                            <SelectItem value="release3" className="text-white">EP Release</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

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

                      <Button onClick={() => handleSongScanRequest('release1')} className="bg-yellow-600 hover:bg-yellow-700">
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

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gray-800 rounded-lg p-6">
                          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            What We Handle
                          </h3>
                          <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              Worldwide royalty collection
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              PRO registration & management
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              Mechanical rights administration
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              Sync licensing opportunities
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              Copyright protection
                            </li>
                          </ul>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-6">
                          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <BarChart className="w-5 h-5 text-purple-500" />
                            Pricing Structure
                          </h3>
                          <div className="space-y-3 text-sm">
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
    </AuthGuard>
  )
}
