"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, PieChart, Globe, TrendingUp, Music } from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"
import { ResponsiveContainer, Tooltip, Pie, PieChart as RechartsPieChart, Cell } from "recharts"
import Image from "next/image"
import { useRouter } from "next/navigation"

type AnalyticsData = {
  totalStreams: number
  totalRevenue: number
  streamsByPlatform: { platform: string; streams: number }[]
  streamsByCountry: { country: string; streams: number }[]
  topReleases: { title: string; streams: number; cover_art_url: string; id: string }[]
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    if (!user) return
    setLoading(true)

    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    // In a real app, this would be a single RPC call to a db function for efficiency
    const [streamsByPlatform, streamsByCountry, topReleases, totals] = await Promise.all([
      supabase.from("analytics").select("platform, streams").eq("user_id", user.id),
      supabase.from("analytics").select("country, streams").eq("user_id", user.id),
      supabase
        .from("releases")
        .select("title, streams, cover_art_url, id")
        .eq("user_id", user.id)
        .order("streams", { ascending: false })
        .limit(5),
      supabase.from("releases").select("streams, revenue").eq("user_id", user.id),
    ])

    const processGroupedData = (data: any[] | null, key: string): { [key: string]: string | number }[] => {
      if (!data || !Array.isArray(data)) return []
      const grouped = data.reduce(
        (acc, item) => {
          const keyValue = String(item[key] || 'Unknown')
          const streams = Number(item.streams) || 0
          acc[keyValue] = (acc[keyValue] || 0) + streams
          return acc
        },
        {} as Record<string, number>,
      )
      return Object.entries(grouped)
        .map(([name, value]) => ({ [key]: name, streams: Number(value) }))
        .sort((a, b) => Number(b.streams) - Number(a.streams))
    }

    const totalStreams = totals.data?.reduce((sum, r) => sum + (r.streams || 0), 0) || 0
    const totalRevenue = totals.data?.reduce((sum, r) => sum + (r.revenue || 0), 0) || 0

    setAnalytics({
      totalStreams,
      totalRevenue,
      streamsByPlatform: processGroupedData(streamsByPlatform.data, "platform") as { platform: string; streams: number }[],
      streamsByCountry: processGroupedData(streamsByCountry.data, "country") as { country: string; streams: number }[],
      topReleases: topReleases.data || [],
    })

    setLoading(false)
  }, [user])

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [fetchAnalytics, user])

  const COLORS = ["#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5A2B"]

  const formatNumber = (num: number) => new Intl.NumberFormat("en-US").format(num)

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen bg-gray-950">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 flex items-center justify-center">
              <CustomLoader size="lg" showText text="Loading analytics..." />
            </main>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!analytics) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen bg-gray-950">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 flex items-center justify-center text-gray-400">
              Could not load analytics data.
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
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-6 pb-20 md:pb-6 content-enter">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gradient font-montserrat">Analytics</h1>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>Real-time data</span>
                </div>
              </div>

              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="card-dark hover-lift">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart className="w-5 h-5" />
                      Total Streams
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-white font-montserrat">{formatNumber(analytics.totalStreams)}</p>
                    <p className="text-sm text-gray-400 mt-2">All platforms combined</p>
                  </CardContent>
                </Card>
                <Card className="card-dark hover-lift">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-white font-montserrat">${analytics.totalRevenue.toFixed(2)}</p>
                    <p className="text-sm text-gray-400 mt-2">Lifetime earnings</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="card-dark hover-lift">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <PieChart className="w-5 h-5" /> Streams by Platform
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.streamsByPlatform.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={analytics.streamsByPlatform}
                            dataKey="streams"
                            nameKey="platform"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {analytics.streamsByPlatform.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(17, 24, 39, 0.95)",
                              border: "1px solid rgba(75, 85, 99, 0.5)",
                              borderRadius: "8px",
                              backdropFilter: "blur(12px)",
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                        <PieChart className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-sm">No platform data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="card-dark hover-lift">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart className="w-5 h-5" /> Top 5 Releases by Streams
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.topReleases.length > 0 ? (
                        analytics.topReleases.map((release, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-800/50 hover:bg-gray-800/50 transition-colors cursor-pointer"
                            onClick={() => router.push(`/releases/${release.id}`)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm font-bold text-white">
                                {index + 1}
                              </div>
                              <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-700">
                                {release.cover_art_url ? (
                                  <Image
                                    src={release.cover_art_url}
                                    alt={release.title}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full">
                                    <Music className="w-6 h-6 text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <span className="text-gray-300 font-medium">{release.title}</span>
                            </div>
                            <span className="font-semibold text-white">{formatNumber(release.streams)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                          <BarChart className="w-12 h-12 mb-3 opacity-50" />
                          <p className="text-sm">No release data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Geographic Data */}
              <Card className="card-dark hover-lift">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Globe className="w-5 h-5" /> Top Streaming Countries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analytics.streamsByCountry.length > 0 ? (
                      analytics.streamsByCountry.slice(0, 6).map((country, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-800/50"
                        >
                          <span className="text-gray-300 font-medium">{country.country}</span>
                          <span className="font-semibold text-white">{formatNumber(country.streams)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full flex flex-col items-center justify-center py-8 text-gray-400">
                        <Globe className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-sm">No geographic data available</p>
                      </div>
                    )}
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
