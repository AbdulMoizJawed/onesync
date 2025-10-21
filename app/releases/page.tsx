"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import CustomLoader from "@/components/ui/custom-loader"
import { IconComponent } from "@/components/ui/icons"
import { useRouter, useSearchParams } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ReleaseImage } from "@/components/optimized-image"
import { animations } from "@/lib/animations"
import { toast } from "sonner"
import { ShieldAlert, AlertCircle } from "lucide-react"
import { SecureReleaseDelete } from "@/components/secure-release-delete"
import Link from "next/link"

type Release = Database["public"]["Tables"]["releases"]["Row"]

// Haptic feedback function
const triggerHaptic = (type: "light" | "medium" | "heavy" = "light") => {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
    }
    navigator.vibrate(patterns[type])
  }
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

function ReleasesContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [releases, setReleases] = useState<Release[]>([])
  const [filteredReleases, setFilteredReleases] = useState<Release[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)
  const [audioLoading, setAudioLoading] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Filter releases based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredReleases(releases)
    } else {
      const filtered = releases.filter(release => 
        release.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (release.artist_name && release.artist_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (release.genre && release.genre.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredReleases(filtered)
    }
  }, [releases, searchTerm])

  const fetchReleases = useCallback(async () => {
    if (!user) return
    setLoading(true)
    if (!supabase) return
    
    const { data, error } = await supabase
      .from("releases")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching releases:", error)
    } else {
      setReleases(data)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    setMounted(true)
    if (user) {
      fetchReleases()
    }
  }, [user, fetchReleases])

  // Cleanup audio when component unmounts
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && audioRef) {
        audioRef.pause()
        setCurrentlyPlaying(null)
      }
    }

    // Add visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      if (audioRef) {
        audioRef.pause()
        audioRef.src = ""
        setAudioRef(null)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [audioRef])

  const handleDeleteRelease = async (releaseId: string) => {
    // This function is now deprecated - use SecureReleaseDelete component instead
    console.warn('Direct delete operation blocked for security. Use SecureReleaseDelete component.')
    return
  }



  const getStatusBadge = (status: string | null) => {
    const statusConfig = {
      live: {
        className:
          "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30 animate-pulse",
        label: "Live",
      },
      approved: {
        className: "bg-gray-800/40 text-gray-300 border border-gray-600/30",
        label: "Approved",
      },
      processing: {
        className: "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30",
        label: "Processing",
      },
      rejected: {
        className: "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30",
        label: "Rejected",
      },
      draft: {
        className: "bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-400 border border-gray-500/30",
        label: "Draft",
      },
      pending: {
        className: "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30",
        label: "Pending",
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <Badge
        className={`${config.className} px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105`}
      >
        {config.label}
      </Badge>
    )
  }

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return "0"
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const handlePlayPause = async (releaseId: string, audioUrl: string | null) => {
    triggerHaptic("medium")

    if (!audioUrl) {
      toast.error("No audio file available for this release")
      return
    }

    if (currentlyPlaying === releaseId) {
      if (audioRef) {
        audioRef.pause()
        setCurrentlyPlaying(null)
      }
    } else {
      if (audioRef) {
        audioRef.pause()
        audioRef.src = ""
      }

      setAudioLoading(releaseId)

      try {
        const audio = new Audio()
        // Remove crossOrigin to avoid CORS issues with most audio hosting services
        // audio.crossOrigin = "anonymous"

        audio.oncanplay = () => {
          setAudioLoading(null)
        }

        audio.onplay = () => {
          setCurrentlyPlaying(releaseId)
        }

        audio.onpause = () => {
          setCurrentlyPlaying(null)
        }

        audio.onended = () => {
          setCurrentlyPlaying(null)
          setAudioRef(null)
        }

        audio.onerror = (e) => {
          console.error("Audio error:", e)
          setCurrentlyPlaying(null)
          setAudioRef(null)
          setAudioLoading(null)
          // Show user-friendly error message
          toast.error("Playback failed - audio file may be corrupted or unavailable")
        }

        audio.src = audioUrl
        audio.load()
        setAudioRef(audio)

        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Audio playback started successfully")
            })
            .catch((error) => {
              console.error("Error starting playback:", error)
              setCurrentlyPlaying(null)
              setAudioRef(null)
              setAudioLoading(null)
              
              // More detailed error handling with user-friendly messages
              if (error.name === 'NotAllowedError') {
                toast.error("Playback blocked - please interact with the page first")
              } else if (error.name === 'NotSupportedError') {
                toast.error("Audio format not supported by your browser")
              } else {
                toast.error("Playback failed - " + (error.message || "unknown error"))
              }
            })
        }
      } catch (error) {
        console.error("Error creating audio element:", error)
        setAudioLoading(null)
      }
    }
  }

  if (!mounted) return null

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-4 sm:p-6 mobile-safe-area ${animations.pageFadeIn}`}>
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-in-top">
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient">Releases</h1>
                  <p className="text-sm sm:text-base text-gray-400">Manage and track your music releases</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <IconComponent name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search releases..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-gray-500 w-full sm:w-64"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      triggerHaptic("light")
                      router.push("/upload")
                    }}
                    className="button-primary group w-full sm:w-auto"
                  >
                    <IconComponent name="addCircle" className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-90" />
                    New Release
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in-bottom">
                <div className="card-dark p-6 hover-lift">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Releases</p>
                      <p className="text-3xl font-bold text-white">{releases.length}</p>
                    </div>
                    <IconComponent name="music" className="w-8 h-8 text-slate-400" />
                  </div>
                </div>
                <div className="card-dark p-6 hover-lift">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Streams</p>
                      <p className="text-3xl font-bold text-white">
                        {formatNumber(releases.reduce((sum, r) => sum + (r.streams || 0), 0))}
                      </p>
                    </div>
                    <IconComponent name="trending" className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>
                <div className="card-dark p-6 hover-lift">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Revenue</p>
                      <p className="text-3xl font-bold text-white">
                        ${releases.reduce((sum, r) => sum + (r.revenue || 0), 0).toFixed(2)}
                      </p>
                    </div>
                    <IconComponent name="barChart" className="w-8 h-8 text-violet-400" />
                  </div>
                </div>
              </div>

              {/* Releases Table */}
              <div className="table-dark animate-fade-in-scale">
                {/* Mobile Card View */}
                <div className="block md:hidden space-y-3">
                  {loading ? (
                    <div className="text-center py-16">
                      <CustomLoader size="lg" text="Loading your releases..." showText={true} />
                    </div>
                  ) : filteredReleases.length > 0 ? (
                    filteredReleases.map((release, index) => (
                      <div
                        key={release.id}
                        className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:bg-gray-900 transition-all duration-200 cursor-pointer"
                        onClick={() => router.push(`/releases/${release.id}`)}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <ReleaseImage
                              src={release.cover_art_url}
                              alt={release.title}
                              size="sm"
                              className="w-16 h-16 rounded-lg"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-white truncate">{release.title}</h3>
                                <p className="text-sm text-gray-400 truncate">{release.artist_name}</p>
                              </div>
                              {getStatusBadge(release.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Streams</p>
                                <p className="text-white font-semibold">{formatNumber(release.streams)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Revenue</p>
                                <p className="text-white font-semibold">${release.revenue?.toFixed(2) || '0.00'}</p>
                              </div>
                              <div className="ml-auto">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-10 h-10"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePlayPause(release.id, release.audio_url)
                                  }}
                                  disabled={!release.audio_url || audioLoading === release.id}
                                >
                                  {audioLoading === release.id ? (
                                    <IconComponent name="volume" className="w-4 h-4 text-amber-400 animate-pulse" />
                                  ) : currentlyPlaying === release.id ? (
                                    <IconComponent name="pause" className="w-4 h-4 text-slate-400" />
                                  ) : (
                                    <IconComponent name="play" className="w-4 h-4 text-gray-400" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 text-gray-400">
                      <p className="mb-4">No releases found</p>
                      <Button asChild>
                        <Link href="/upload">Upload Your First Release</Link>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-gray-900/50">
                      <TableHead className="table-header">Cover</TableHead>
                      <TableHead className="table-header w-[60px]">Preview</TableHead>
                      <TableHead className="table-header">Title</TableHead>
                      <TableHead className="table-header">Artist</TableHead>
                      <TableHead className="table-header">Status</TableHead>
                      <TableHead className="table-header text-right">Streams</TableHead>
                      <TableHead className="table-header text-right">Revenue</TableHead>
                      <TableHead className="table-header text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-16">
                          <CustomLoader size="lg" text="Loading your releases..." showText={true} />
                        </TableCell>
                      </TableRow>
                    ) : releases.length > 0 ? (
                      filteredReleases.map((release, index) => (
                        <TableRow
                          key={release.id}
                          className="table-row stagger-item hover-lift cursor-pointer"
                          style={{ animationDelay: `${index * 0.1}s` }}
                          onClick={(e) => {
                            // Don't navigate if clicking on action buttons
                            if ((e.target as HTMLElement).closest('.dropdown-menu-trigger, button')) {
                              return
                            }
                            router.push(`/releases/${release.id}`)
                          }}
                        >
                          <TableCell className="table-cell">
                            <div className="relative group">
                              <ReleaseImage
                                src={release.cover_art_url}
                                alt={release.title}
                                size="sm"
                                className="w-12 h-12 rounded-lg transition-transform duration-300 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <IconComponent name="view" className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="table-cell">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-10 h-10 hover:bg-gray-800/50 transition-all duration-300 transform hover:scale-110 active:scale-95 relative overflow-hidden group"
                              onClick={() => handlePlayPause(release.id, release.audio_url)}
                              disabled={!release.audio_url || audioLoading === release.id}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-gray-800/10 to-gray-700/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              {audioLoading === release.id ? (
                                <IconComponent name="volume" className="w-4 h-4 text-amber-400 animate-pulse relative z-10" />
                              ) : currentlyPlaying === release.id ? (
                                <IconComponent name="pause" className="w-4 h-4 text-slate-400 relative z-10" />
                              ) : (
                                <IconComponent name="play" className="w-4 h-4 text-gray-400 group-hover:text-slate-300 relative z-10" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="table-cell">
                            <div className="space-y-1">
                              <p className="font-medium text-white">{release.title}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(release.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="table-cell text-gray-400">{release.artist_name}</TableCell>
                          <TableCell className="table-cell">{getStatusBadge(release.status)}</TableCell>
                          <TableCell className="table-cell text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-semibold text-white">{formatNumber(release.streams)}</span>
                              <span className="text-xs text-gray-500">streams</span>
                            </div>
                          </TableCell>
                          <TableCell className="table-cell text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-semibold text-white">${(release.revenue || 0).toFixed(2)}</span>
                              <span className="text-xs text-gray-500">earned</span>
                            </div>
                          </TableCell>
                          <TableCell className="table-cell text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 transition-all duration-300 transform hover:scale-110 active:scale-95"
                                  onClick={() => triggerHaptic("light")}
                                >
                                  <IconComponent name="moreHorizontal" className="w-4 h-4 text-gray-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-gray-900/95 border-gray-700/50 backdrop-blur-xl animate-fade-in-scale"
                              >
                                <DropdownMenuItem
                                  onClick={() => {
                                    triggerHaptic("light")
                                    router.push(`/releases/${release.id}`)
                                  }}
                                  className="hover:bg-gray-800/50 transition-all duration-300 group"
                                >
                                  <IconComponent name="edit" className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    triggerHaptic("light")
                                    router.push(`/analytics?release=${release.id}`)
                                  }}
                                  className="hover:bg-gray-800/50 transition-all duration-300 group"
                                >
                                  <IconComponent name="barChart" className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                                  View Analytics
                                </DropdownMenuItem>
                                <div className="px-2 py-1">
                                  <SecureReleaseDelete
                                    releaseId={release.id}
                                    releaseTitle={release.title}
                                    onRequestSubmitted={() => {
                                      triggerHaptic("medium")
                                      fetchReleases() // Refresh the list
                                    }}
                                  />
                                </div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-20">
                          <div className="flex flex-col items-center space-y-6 animate-fade-in-scale">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center">
                              <IconComponent name="music" className="w-10 h-10 text-gray-400" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-xl font-semibold text-white">No releases found</h3>
                              <p className="text-gray-500">Get started by uploading your first track.</p>
                            </div>
                            <Button
                              onClick={() => {
                                triggerHaptic("medium")
                                router.push("/upload")
                              }}
                              className="button-primary group"
                            >
                              <IconComponent name="addCircle" className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                              Upload Release
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}

export default function ReleasesPage() {
  return (
    <>
      <Suspense fallback={null}>
        <AuthMessageHandler />
      </Suspense>
      <ReleasesContent />
    </>
  )
}
