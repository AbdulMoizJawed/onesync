'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Music, 
  Download, 
  Heart, 
  DollarSign, 
  Upload,
  Settings,
  BarChart3,
  Crown
} from 'lucide-react'

interface BeatStatsType {
  totalBeats: number
  totalSales: number
  totalEarnings: number
  totalLikes: number
  totalPlays: number
  totalDownloads: number
}

interface UserBeat {
  id: string
  title: string
  genre: string
  price: {
    basic: number
    premium: number
    unlimited: number
  }
  plays: number
  likes: number
  sales: number
  earnings: number
  uploadDate: string
  status: 'active' | 'pending' | 'removed'
}

interface PurchasedBeat {
  id: string
  title: string
  producer: string
  licenseType: 'basic' | 'premium' | 'unlimited' | 'exclusive'
  purchaseDate: string
  price: number
  downloadUrl: string
}

export default function BeatProfile() {
  const [activeTab, setActiveTab] = useState('overview')
  const [beatStats, setBeatStats] = useState<BeatStatsType>({
    totalBeats: 0,
    totalSales: 0,
    totalEarnings: 0,
    totalLikes: 0,
    totalPlays: 0,
    totalDownloads: 0
  })
  const [userBeats, setUserBeats] = useState<UserBeat[]>([])
  const [purchasedBeats, setPurchasedBeats] = useState<PurchasedBeat[]>([])
  const [loading, setLoading] = useState(true)
  const [isProducer, setIsProducer] = useState(false)

  useEffect(() => {
    fetchUserBeatData()
  }, [])

  const fetchUserBeatData = async () => {
    try {
      setLoading(true)
      
      // Mock user ID - in production this would come from auth
      const userId = 'user123'
      
      const [statsRes, beatsRes, purchasesRes] = await Promise.all([
        fetch(`/api/beats?action=user-stats&userId=${userId}`),
        fetch(`/api/beats?action=user-beats&userId=${userId}`),
        fetch(`/api/beats?action=user-purchases&userId=${userId}`)
      ])

      const stats = await statsRes.json()
      const beats = await beatsRes.json()
      const purchases = await purchasesRes.json()

      setBeatStats(stats)
      setUserBeats(beats.beats || [])
      setPurchasedBeats(purchases.purchases || [])
      setIsProducer(beats.beats?.length > 0 || false)
    } catch (error) {
      console.error('Failed to fetch user beat data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback>
                <User className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-white">Beat Profile</h1>
              <p className="text-gray-400">
                {isProducer ? 'Producer & Buyer' : 'Beat Buyer'}
              </p>
            </div>
            {isProducer && (
              <Badge className="bg-yellow-600 text-yellow-100 border-yellow-500">
                <Crown className="w-3 h-3 mr-1" />
                Producer
              </Badge>
            )}
          </div>
          
          <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
            <Settings className="w-4 h-4 mr-2" />
            Profile Settings
          </Button>
        </div>

        {/* Stats Overview */}
        {isProducer && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-400">Total Beats</p>
                    <p className="text-lg font-semibold text-white">{beatStats.totalBeats}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-xs text-gray-400">Total Sales</p>
                    <p className="text-lg font-semibold text-white">{beatStats.totalSales}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-xs text-gray-400">Earnings</p>
                    <p className="text-lg font-semibold text-white">${beatStats.totalEarnings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-xs text-gray-400">Total Likes</p>
                    <p className="text-lg font-semibold text-white">{beatStats.totalLikes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-xs text-gray-400">Total Plays</p>
                    <p className="text-lg font-semibold text-white">{beatStats.totalPlays.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-400">Downloads</p>
                    <p className="text-lg font-semibold text-white">{beatStats.totalDownloads}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            {isProducer && (
              <>
                <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700 relative">
                  My Beats
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700">
                  Analytics
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="purchases" className="data-[state=active]:bg-gray-700">
              Purchased Beats
            </TabsTrigger>
          </TabsList>

          {/* My Beats Tab - Coming Soon */}
          {isProducer && (
            <TabsContent value="overview" className="space-y-6">
              <div className="text-center py-12 space-y-6">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-green-500 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">My Beats Dashboard</h3>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                      <span className="text-yellow-400 text-sm font-medium">Coming Soon</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 max-w-md mx-auto">
                    Your comprehensive beat management dashboard is being crafted with powerful tools for producers.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="bg-gray-800/50 rounded-lg p-4 space-y-2 border border-gray-700/50">
                    <Upload className="w-8 h-8 text-purple-400 mx-auto" />
                    <h4 className="font-semibold text-white text-sm">Upload & Organize</h4>
                    <p className="text-xs text-gray-400">Manage your beat library with advanced organization tools</p>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-4 space-y-2 border border-gray-700/50">
                    <svg className="w-8 h-8 text-blue-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h4 className="font-semibold text-white text-sm">Analytics</h4>
                    <p className="text-xs text-gray-400">Track performance, sales, and audience insights</p>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-4 space-y-2 border border-gray-700/50">
                    <svg className="w-8 h-8 text-green-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <h4 className="font-semibold text-white text-sm">Revenue</h4>
                    <p className="text-xs text-gray-400">Monitor earnings and payout history</p>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Get Notified When Ready
                </Button>
              </div>
            </TabsContent>
          )}

          {/* Analytics Tab */}
          {isProducer && (
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Revenue Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-400">
                      Revenue chart would go here
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Top Performing Beats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {userBeats.slice(0, 5).map((beat, index) => (
                        <div key={beat.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 font-mono text-sm">#{index + 1}</span>
                            <span className="text-white">{beat.title}</span>
                          </div>
                          <span className="text-gray-400">{beat.plays} plays</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Purchased Beats Tab */}
          <TabsContent value="purchases" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">Purchased Beats</h3>
              <p className="text-gray-400">{purchasedBeats.length} beats purchased</p>
            </div>

            <div className="grid gap-4">
              {purchasedBeats.map((purchase) => (
                <Card key={purchase.id} className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-white font-medium">{purchase.title}</h4>
                          <Badge className={
                            purchase.licenseType === 'exclusive' ? 'bg-purple-600 text-purple-100' :
                            purchase.licenseType === 'unlimited' ? 'bg-blue-600 text-blue-100' :
                            purchase.licenseType === 'premium' ? 'bg-green-600 text-green-100' :
                            'bg-gray-600 text-gray-100'
                          }>
                            {purchase.licenseType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>by {purchase.producer}</span>
                          <span>•</span>
                          <span>Purchased {new Date(purchase.purchaseDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-white font-semibold">${purchase.price}</p>
                        </div>
                        <Button size="sm" variant="outline" className="border-gray-700 text-white">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
