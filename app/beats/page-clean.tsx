'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Breadcrumb } from '@/components/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Music, Crown, TrendingUp, Users, Bell } from 'lucide-react'

export default function BeatMarketplace() {
  const { user, loading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
                  { label: 'Home', href: '/' },
                  { label: 'Beat Marketplace', href: '/beats' }
                ]} 
              />
            </div>
          </div>

          {/* Coming Soon Section */}
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              
              {/* My Beats Section - Coming Soon */}
              <Card className="bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-gray-900/40 border-blue-500/30 mb-8">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Music className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">My Beats</CardTitle>
                      <p className="text-gray-300 text-sm">Manage your beat library and track performance</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                    <div className="mb-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium mb-3">
                        <Crown className="w-4 h-4" />
                        Coming Soon
                      </div>
                    </div>
                    <h3 className="text-white text-lg font-semibold mb-2">Your Beat Dashboard</h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      Upload, organize, and track the performance of your beats. Get detailed analytics on plays, likes, and sales.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-300">Performance Analytics</p>
                      </div>
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-300">Collaboration Tools</p>
                      </div>
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <Music className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-300">Beat Management</p>
                      </div>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Bell className="w-4 h-4 mr-2" />
                      Notify Me When Available
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Sell Your Beats Section - Coming Soon */}
              <Card className="bg-gradient-to-br from-green-900/30 via-yellow-900/20 to-gray-900/40 border-green-500/30">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Crown className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">Sell Your Beats</CardTitle>
                      <p className="text-gray-300 text-sm">Monetize your music and reach a global audience</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                    <div className="mb-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium mb-3">
                        <Crown className="w-4 h-4" />
                        Coming Soon
                      </div>
                    </div>
                    <h3 className="text-white text-lg font-semibold mb-2">Beat Marketplace</h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      Set up your producer storefront, manage licensing options, and start earning from your beats with our comprehensive marketplace.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-300">Flexible Licensing</p>
                      </div>
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-300">Revenue Tracking</p>
                      </div>
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-300">Global Reach</p>
                      </div>
                    </div>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <Bell className="w-4 h-4 mr-2" />
                      Get Early Access
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
