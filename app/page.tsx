"use client"

import { useEffect, useState, useCallback, useRef, Suspense } from "react"
import Image from 'next/image'
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { useOnboarding } from "@/lib/onboarding"
import { supabase } from "@/lib/supabase"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Music, Upload, BarChart3, Users, Headphones, TrendingUp, AlertCircle, ShieldAlert } from "lucide-react"
import CustomLoader from "@/components/ui/custom-loader"
import { OnboardingWizard } from "@/components/onboarding-wizard"
import { DashboardSkeleton } from "@/components/loading-skeletons"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { WorldMap } from "@/components/dashboard/world-map"
import { ApiStatusDebug } from "@/components/dev/api-status-debug"
import { IntercomFloatingButton } from "@/components/intercom-button"
import { animations } from "@/lib/animations"
import Link from "next/link"
import { ClientTime } from "@/components/ui/client-time"

interface UserStats {
  totalReleases: number
  totalStreams: number
  revenue: number
  totalArtists: number
}

interface TopRelease {
  id: string
  title: string
  artist_name: string
  cover_art_url: string | null
  streams: number
  revenue: number
}

interface RecentActivity {
  id: string
  message: string
  timestamp: string
  type: "success" | "info" | "warning"
}

// Component that uses useSearchParams wrapped in Suspense
function AuthMessageHandler() {
  const searchParams = useSearchParams()
  const authError = searchParams?.get('error')
  const authMessage = searchParams?.get('message')

  if (authError || authMessage) {
    return (
      <div className="fixed top-4 right-4 z-50">
        {authError && (
          <Alert className="mb-2 border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              {authError}
            </AlertDescription>
          </Alert>
        )}
        {authMessage && (
          <Alert className="mb-2 border-blue-500 bg-blue-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-blue-700">
              {authMessage}
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  return null
}

function DashboardContent() {
  const { user, loading: authLoading } = useAuth()
  const { isNewUser, completeOnboarding } = useOnboarding()
  const redirectGuard = useRef(false)
  const router = useRouter()
  const pathname = usePathname()
  const [stats, setStats] = useState<UserStats>({
    totalReleases: 0,
    totalStreams: 0,
    revenue: 0,
    totalArtists: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [topReleases, setTopReleases] = useState<TopRelease[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userProfile, setUserProfile] = useState<any>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // Single consolidated auth check to prevent infinite loops
  useEffect(() => {
    // Small delay to ensure proper hydration
    const timer = setTimeout(() => setIsMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    console.log("📊 Dashboard auth check - user:", user ? user.email : 'null', "authLoading:", authLoading)

    // Wait until auth provider finishes initializing
    if (authLoading) {
      console.log("⏳ Auth initializing, waiting...")
      return
    }

    // If we're already on an auth route, skip redirect to avoid loops
    if (pathname && pathname.startsWith('/auth')) {
      console.log('🔓 Already on auth route (', pathname, '), skipping redirect')
      return
    }

    // REMOVED DUPLICATE REDIRECT LOGIC - Let AuthGuard handle it
    if (user) {
      console.log("✅ User authenticated on dashboard:", user.email)
      redirectGuard.current = false // Reset guard if user is found
    }
  }, [user, authLoading, router, pathname, isMounted])

  const loadUserData = useCallback(async () => {
    if (!user || !supabase) return

    try {
      setLoading(true)
      setError("")
      console.log("Starting data load for user:", user.id)

      // Load user profile to ensure it exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()



      console.log("Profile result:", { profile, profileError })

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Profile error:", profileError)
        setError("Failed to load user profile")
        return
      }

      // Store profile data for welcome message
      setUserProfile(profile)

      // Check if this is a new user (no profile exists)
      const isFirstTime = profileError && profileError.code === "PGRST116"

      // Load real stats from the database
      const [releasesResult, analyticsResult, topReleasesResult] = await Promise.all([
        supabase
          .from("releases")
          .select("id, streams, revenue")
          .eq("user_id", user.id),
        supabase
          .from("analytics")
          .select("streams, revenue, platform")
          .eq("user_id", user.id),
        supabase
          .from("releases")
          .select("id, title, artist_name, cover_art_url, streams, revenue")
          .eq("user_id", user.id)
          .order("streams", { ascending: false })
          .limit(5)
      ])


      const releases = releasesResult.data || []
      const analytics = analyticsResult.data || []
      const topReleasesData = topReleasesResult.data || []
      console.log('log1', releases, analytics, topReleasesData)

      // Calculate stats from real data
      const totalReleases = releases.length
      const totalStreams = releases.reduce((sum, release) => sum + (release.streams || 0), 0)
      const revenue = releases.reduce((sum, release) => sum + (release.revenue || 0), 0)

      setStats({
        totalReleases,
        totalStreams,
        revenue,
        totalArtists: 0,
      })

      // Set top releases
      setTopReleases(topReleasesData as TopRelease[])

      // Set activity based on user status
      const activities: RecentActivity[] = []

      if (totalReleases === 0) {
        activities.push({
          id: "1",
          message: "Welcome back! Start by uploading your first release.",
          timestamp: new Date().toISOString(),
          type: "info",
        })
      } else {
        activities.push({
          id: "1",
          message: `You have ${totalReleases} release${totalReleases === 1 ? '' : 's'} with ${totalStreams.toLocaleString()} total streams.`,
          timestamp: new Date().toISOString(),
          type: "success",
        })

        if (revenue > 0) {
          activities.push({
            id: "2",
            message: `Total earnings: $${revenue.toFixed(2)}`,
            timestamp: new Date().toISOString(),
            type: "success",
          })
        }

        if (releases.length > 1) {
          activities.push({
            id: "3",
            message: `${releases.length} releases active`,
            timestamp: new Date().toISOString(),
            type: "info",
          })
        }
      }

      setRecentActivity(activities)
    } catch (error) {
      console.error("Error loading user data:", error)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }, [user])

  // Load data when user is authenticated
  useEffect(() => {
    if (user && supabase && !authLoading) {
      loadUserData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]) // loadUserData intentionally excluded to prevent infinite loop

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center" suppressHydrationWarning>
        <div className="flex flex-col items-center gap-4">
          <CustomLoader size="lg" />
          <p className="text-gray-400 animate-pulse" suppressHydrationWarning>
            Loading...
          </p>
        </div>
      </div>
    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-400"
      case "warning":
        return "bg-yellow-400"
      default:
        return "bg-indigo-400"
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    // Return consistent value for hydration - will be replaced by ClientTime component
    return "Just now"
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar
        // collapsed={sidebarCollapsed}
        // onToggle={() => {
        //   console.log('Desktop sidebar toggle called, current state:', sidebarCollapsed)
        //   setSidebarCollapsed(!sidebarCollapsed)
        // }}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => {
          console.log('Mobile sidebar close called, setting to false')
          setMobileSidebarOpen(false)
        }}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onToggleMobileSidebar={() => {
            console.log('Toggle mobile sidebar called, current state:', mobileSidebarOpen)
            setMobileSidebarOpen(prevState => !prevState)
          }}
          mobileOpen={mobileSidebarOpen}
        />
        <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-slate-950 p-3 sm:p-4 md:p-6 pb-24 md:pb-6 ${animations.pageFadeIn}`}>
          <div className="max-w-7xl mx-auto">
            <div className={`mb-4 sm:mb-6 ${animations.slideInTop}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 font-montserrat" suppressHydrationWarning>
                    {isMounted ? `Welcome back, ${userProfile?.first_name || userProfile?.full_name || user?.user_metadata?.first_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'}` : 'Welcome back'}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-400">
                    Manage your music distribution and track your performance across all artists.
                  </p>
                </div>
                <div className="w-full sm:w-auto">
                  <Button asChild className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-900/30 h-11 sm:h-12 px-4 sm:px-6 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 animate-subtle-pulse">
                    <Link href="/upload" className="flex items-center justify-center space-x-2">
                      <Upload className="h-4 w-4 sm:h-5 sm:h-5" />
                      <span className="font-semibold text-sm sm:text-base">Upload New Release</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-950/50 border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <DashboardSkeleton />
            ) : (
              <>
                {/* Quick Stats - 2x2 Grid on Mobile, 3 across on Desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-6">
                  <Link href="/releases">
                    <Card className={`bg-slate-900/80 border-slate-800/50 ${animations.cardSlideUp} ${animations.staggerDelay(0)} hover:scale-102 transition-all duration-250 backdrop-blur-sm`}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">Releases</CardTitle>
                        <Music className="h-4 w-4 text-gray-400" />
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="text-xl sm:text-2xl font-bold text-white font-montserrat">{stats.totalReleases}</div>
                        <p className="text-xs text-gray-500 mt-0.5">{stats.totalReleases === 0 ? (
                          <span className="flex items-center">
                            <span className="inline-block w-2 h-2 bg-gray-600 rounded-full mr-1 animate-pulse"></span>
                            Upload first
                          </span>
                        ) : "Active"}</p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href="/payments">
                    <Card className={`bg-slate-900/80 border-slate-800/50 ${animations.cardSlideUp} ${animations.staggerDelay(1)} hover:scale-102 transition-all duration-250 backdrop-blur-sm`}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="text-xl sm:text-2xl font-bold text-white font-montserrat">${stats.revenue.toFixed(2)}</div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {stats.revenue === 0 ? (
                            <span className="flex items-center">
                              <span className="inline-block w-2 h-2 bg-gray-600 rounded-full mr-1 animate-pulse"></span>
                              Waiting
                            </span>
                          ) : "Total earned"}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href="/beats">
                    <Card className={`bg-slate-900/80 border-slate-800/50 ${animations.cardSlideUp} ${animations.staggerDelay(2)} hover:scale-102 transition-all duration-250 backdrop-blur-sm`}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">Streams</CardTitle>
                        <Headphones className="h-4 w-4 text-gray-400" />
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="text-xl sm:text-2xl font-bold text-white font-montserrat">
                          {stats.totalStreams.toLocaleString()}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {stats.totalStreams === 0 ? (
                            <span className="flex items-center">
                              <span className="inline-block w-2 h-2 bg-gray-600 rounded-full mr-1 animate-pulse"></span>
                              Awaiting data
                            </span>
                          ) : "All time"}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>

                {/* Quick Access Tools - Only visible on mobile/tablet */}
                <div className="lg:hidden mb-6">
                  <Card className="bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader className="p-4">
                      <CardTitle className="text-white text-base font-montserrat flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Quick Access
                      </CardTitle>
                      <CardDescription className="text-gray-400 text-sm">
                        Your favorite tools
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                        <Link href="/artist-tools" className="flex flex-col items-center p-2.5 sm:p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gray-600 transition-all duration-200 group active:scale-95">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform">
                            <Music className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-white" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium text-center text-gray-300 group-hover:text-white leading-tight">Artist Tools</span>
                        </Link>

                        <Link href="/industry-stats" className="flex flex-col items-center p-2.5 sm:p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gray-600 transition-all duration-200 group active:scale-95">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform">
                            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-white" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium text-center text-gray-300 group-hover:text-white leading-tight">Stats</span>
                        </Link>

                        <Link href="/beats" className="flex flex-col items-center p-2.5 sm:p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gray-600 transition-all duration-200 group active:scale-95">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform">
                            <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-white" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium text-center text-gray-300 group-hover:text-white leading-tight">Beats</span>
                        </Link>

                        <Link href="/artists" className="flex flex-col items-center p-2.5 sm:p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gray-600 transition-all duration-200 group active:scale-95">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-white" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium text-center text-gray-300 group-hover:text-white leading-tight">Artists</span>
                        </Link>

                        <Link href="/mastering" className="flex flex-col items-center p-2.5 sm:p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gray-600 transition-all duration-200 group active:scale-95">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-white" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium text-center text-gray-300 group-hover:text-white leading-tight">Mastering</span>
                        </Link>

                        <Link href="/sync" className="flex flex-col items-center p-2.5 sm:p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gray-600 transition-all duration-200 group active:scale-95">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform">
                            <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-white" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium text-center text-gray-300 group-hover:text-white leading-tight">Sync</span>
                        </Link>

                        <Link href="/forum" className="flex flex-col items-center p-2.5 sm:p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gray-600 transition-all duration-200 group active:scale-95">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium text-center text-gray-300 group-hover:text-white leading-tight">Forum</span>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Releases */}
                {topReleases.length > 0 ? (
                  <Card className="bg-slate-900/80 border-slate-800/50 animate-slide-in-up stagger-1 hover-lift-gentle mb-4 sm:mb-6 backdrop-blur-sm">
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-white text-base sm:text-lg md:text-xl flex items-center gap-2 font-montserrat">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                        Top 5 Releases by Streams
                      </CardTitle>
                      <CardDescription className="text-gray-400 text-xs sm:text-sm">
                        Your most streamed releases
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="space-y-2 sm:space-y-3">
                        {topReleases.map((release, index) => (
                          <div
                            key={release.id}
                            className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
                            onClick={() => router.push(`/releases/${release.id}`)}
                          >
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-800 overflow-hidden">
                                {release.cover_art_url ? (
                                  <Image
                                    src={release.cover_art_url}
                                    alt={release.title}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Music className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium truncate text-sm sm:text-base">{release.title}</h4>
                              <p className="text-gray-400 text-xs sm:text-sm truncate">{release.artist_name}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-white font-medium text-sm sm:text-base">
                                {(release.streams || 0).toLocaleString()}
                              </p>
                              <p className="text-gray-400 text-sm">streams</p>
                            </div>
                            <div className="text-right">
                              <p className="text-green-400 font-medium">
                                ${(release.revenue || 0).toFixed(2)}
                              </p>
                              <p className="text-gray-400 text-sm">revenue</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : stats.totalReleases > 0 ? (
                  <Card className="bg-gray-900 border-gray-800 animate-slide-in-up stagger-1 hover-lift-gentle mb-6 sm:mb-8">
                    <CardHeader>
                      <CardTitle className="text-white text-lg sm:text-xl flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Top Releases
                      </CardTitle>
                      <CardDescription className="text-gray-400 text-sm">
                        Your most streamed releases will appear here
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                          <Music className="w-8 h-8 text-gray-600" />
                        </div>
                        <h4 className="text-white font-medium">Waiting for streaming data</h4>
                        <p className="text-gray-400 text-sm max-w-sm">
                          As your releases gather streams, your top performing tracks will be displayed here with performance metrics
                        </p>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <span className="inline-block w-2 h-2 bg-gray-600 rounded-full animate-pulse"></span>
                          <span>Data updates every 24 hours</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-slate-900/80 border-slate-800/50 animate-slide-in-up stagger-1 hover-lift-gentle mb-6 sm:mb-8 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white text-lg sm:text-xl flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Get Started
                      </CardTitle>
                      <CardDescription className="text-gray-400 text-sm">
                        Upload your first release to begin tracking performance
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                          <Upload className="w-10 h-10 text-indigo-400" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-white font-medium">Upload Your First Release</h4>
                          <p className="text-gray-400 text-sm max-w-sm">
                            Share your music with the world! Upload your tracks to get started with distribution and analytics.
                          </p>
                        </div>
                        <Link href="/upload">
                          <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-900/30">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Music
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <Card className="bg-gray-900 border-gray-800 animate-slide-in-left stagger-1 hover-lift-gentle">
                    <CardHeader>
                      <CardTitle className="text-white text-lg sm:text-xl font-montserrat">Quick Actions</CardTitle>
                      <CardDescription className="text-gray-400 text-sm">
                        Get started with your music distribution
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      <Button asChild className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-900/30 h-10 sm:h-11 animate-slide-in-up stagger-1 transition-all duration-200">
                        <Link href="/upload">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload New Release
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full border-gray-700 text-white hover:bg-gray-800 bg-transparent h-10 sm:h-11 animate-slide-in-up stagger-2"
                      >
                        <Link href="/analytics">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          View Analytics
                        </Link>
                      </Button>

                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900 border-gray-800 animate-slide-in-right stagger-2 hover-lift-gentle">
                    <CardHeader>
                      <CardTitle className="text-white text-lg sm:text-xl font-montserrat">Recent Activity</CardTitle>
                      <CardDescription className="text-gray-400 text-sm">
                        Your latest updates and notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {recentActivity.length === 0 ? (
                        <div className="text-center py-6 space-y-3">
                          <div className="w-16 h-16 mx-auto rounded-full bg-gray-800 flex items-center justify-center">
                            <div className="relative">
                              <div className="w-3 h-3 bg-indigo-400 rounded-full animate-ping absolute top-0 right-0"></div>
                              <AlertCircle className="w-8 h-8 text-gray-600" />
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">No recent activity yet</p>
                            <p className="text-gray-600 text-xs mt-1">
                              Activity will appear here as you use the platform
                            </p>
                          </div>
                          <div className="flex items-center justify-center space-x-1 text-xs text-gray-500 pt-2">
                            <span className="inline-block w-2 h-2 bg-gray-600 rounded-full animate-pulse"></span>
                            <span>Waiting for activity</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {recentActivity.map((activity, index) => (
                            <div key={activity.id} className={`flex items-center space-x-4 animate-slide-in-up stagger-${Math.min(index + 1, 5)} hover-scale`}>
                              <div className={`w-2 h-2 rounded-full ${getActivityIcon(activity.type)} animate-ping`}></div>
                              <div className="flex-1">
                                <p className="text-sm text-white">{activity.message}</p>
                                <ClientTime
                                  timestamp={activity.timestamp}
                                  className="text-xs text-gray-500"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Analytics Visualizations */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <RevenueChart
                    data={stats.totalStreams > 0 ? [
                      { month: "Jan", revenue: 0, streams: 0 },
                      { month: "Feb", revenue: 0, streams: 0 },
                      { month: "Mar", revenue: 0, streams: 0 },
                      { month: "Apr", revenue: 0, streams: 0 },
                      { month: "May", revenue: 0, streams: 0 },
                      { month: "Jun", revenue: 0, streams: 0 }
                    ] : []}
                  />
                  <WorldMap
                    locations={stats.totalStreams > 0 ? [
                      { id: "1", country: "United States", city: "New York", streams: 0, revenue: 0, region: "North America" },
                      { id: "2", country: "United Kingdom", city: "London", streams: 0, revenue: 0, region: "Europe" },
                      { id: "3", country: "Japan", city: "Tokyo", streams: 0, revenue: 0, region: "Asia" }
                    ] : []}
                  />
                </div>

                {/* Getting Started Section for New Users */}
                {stats.totalReleases === 0 && (
                  <Card className="bg-slate-900/60 border-slate-800/40 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white text-lg sm:text-xl font-montserrat">Getting Started</CardTitle>
                      <CardDescription className="text-gray-400 text-sm">
                        Welcome to OneSync! Here&apos;s how to get your music distributed
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="text-center">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                          <h3 className="text-white font-medium mb-2 text-sm sm:text-base">1. Upload Your Music</h3>
                          <p className="text-gray-400 text-xs sm:text-sm">Upload your tracks, artwork, and metadata</p>
                        </div>
                        <div className="text-center">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                          <h3 className="text-white font-medium mb-2 text-sm sm:text-base">2. Track Performance</h3>
                          <p className="text-gray-400 text-xs sm:text-sm">Monitor streams, earnings, and analytics</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

              </>
            )}
          </div>
        </main>
      </div>

      {/* Onboarding Wizard */}
      <OnboardingWizard
        isOpen={isNewUser || false}
        onClose={() => {
          completeOnboarding()
          // Refresh the dashboard data
          loadUserData()
        }}
      />

      {/* Floating Intercom Support Button */}
      <IntercomFloatingButton />

    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true}>
      <Suspense fallback={null}>
        <AuthMessageHandler />
      </Suspense>
      <DashboardContent />
    </AuthGuard>
  )
}
