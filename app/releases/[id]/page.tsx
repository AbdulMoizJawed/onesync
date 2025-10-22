"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import CustomLoader from "@/components/ui/custom-loader"
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Download, 
  Share2, 
  BarChart3, 
  Edit, 
  Trash2,
  AlertTriangle,
  TrendingUp,
  Eye,
  Music,
  Calendar,
  Globe,
  DollarSign,
  User,
  Tag,
  FileText,
  Clock,
  Headphones,
  ListMusic,
  Star
} from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

type Release = Database["public"]["Tables"]["releases"]["Row"]

interface Track {
  id: string
  title: string
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
  audioUrl?: string
}

const TAKEDOWN_REASONS = [
  { value: 'copyright', label: 'Copyright Infringement' },
  { value: 'unauthorized', label: 'Unauthorized Use' },
  { value: 'quality', label: 'Quality Issues' },
  { value: 'duplicate', label: 'Duplicate Release' },
  { value: 'metadata', label: 'Incorrect Metadata' },
  { value: 'other', label: 'Other' }
]

export default function ReleaseDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [release, setRelease] = useState<Release | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)
  const [showTakedownDialog, setShowTakedownDialog] = useState(false)
  const [takedownReason, setTakedownReason] = useState('')
  const [takedownDetails, setTakedownDetails] = useState('')
  const [submittingTakedown, setSubmittingTakedown] = useState(false)
  const [existingTakedown, setExistingTakedown] = useState<any>(null)
  const [checkingTakedown, setCheckingTakedown] = useState(false)

  // New state for parsed metadata
  const [tracks, setTracks] = useState<Track[]>([])
  const [metadata, setMetadata] = useState<any>({})

  const fetchRelease = useCallback(async () => {
    if (!user || !id || !supabase) return
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from("releases")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (error) {
        console.error("Error fetching release:", error)
        router.push("/releases")
      } else {
        setRelease(data)
        
        // Parse metadata if available
        if (data.metadata) {
          // Metadata is already an object in the database
          const parsedMetadata = data.metadata
          setMetadata(parsedMetadata)
          
          // Extract tracks if available
          if (parsedMetadata.tracks && Array.isArray(parsedMetadata.tracks)) {
            setTracks(parsedMetadata.tracks)
          }
        }
        
        // After fetching release, check for existing takedown
        await checkExistingTakedown(data.id)
      }
    } catch (error) {
      console.error("Error fetching release:", error)
      router.push("/releases")
    } finally {
      setLoading(false)
    }
  }, [id, user, router])

  /**
   * Get user-friendly status label and color for takedown request
   */
  const getTakedownStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Takedown Requested',
          color: 'bg-yellow-600',
          borderColor: 'border-yellow-600',
          description: 'Your request is awaiting admin review'
        }
      case 'in_progress':
        return {
          label: 'Takedown In Progress',
          color: 'bg-blue-600',
          borderColor: 'border-blue-600',
          description: 'Your release is being removed from platforms'
        }
      case 'completed':
        return {
          label: 'Takedown Completed',
          color: 'bg-green-600',
          borderColor: 'border-green-600',
          description: 'This release has been taken down'
        }
      case 'rejected':
        return {
          label: 'Takedown Rejected',
          color: 'bg-red-600',
          borderColor: 'border-red-600',
          description: 'Your takedown request was rejected'
        }
      default:
        return {
          label: 'Unknown Status',
          color: 'bg-gray-600',
          borderColor: 'border-gray-600',
          description: ''
        }
    }
  }

  /**
   * Check if there's an existing takedown request for this release
   * 
   * Purpose:
   * - Prevent duplicate takedown requests
   * - Show current takedown status to user
   * - Display appropriate UI based on request state
   */
  const checkExistingTakedown = async (releaseId: string) => {
    if (!user || !supabase) return
    
    setCheckingTakedown(true)
    try {
      const { data, error } = await supabase
        .from('user_takedown_requests')
        .select('*')
        .eq('release_id', releaseId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking takedown request:', error)
        return
      }

      setExistingTakedown(data)
    } catch (error) {
      console.error('Error checking takedown request:', error)
    } finally {
      setCheckingTakedown(false)
    }
  }

  useEffect(() => {
    if (id && user) {
      fetchRelease()
    }
  }, [id, user, fetchRelease])

  useEffect(() => {
    return () => {
      if (audioRef) {
        audioRef.pause()
        audioRef.src = ""
        setAudioRef(null)
      }
    }
  }, [audioRef])

  const handlePlayPause = (trackId?: string, audioUrl?: string) => {
    // Handle main audio file
    if (!trackId && release?.audio_url) {
      if (currentlyPlaying === 'main') {
        audioRef?.pause()
        setCurrentlyPlaying(null)
      } else {
        if (audioRef) {
          audioRef.pause()
        }
        const audio = new Audio(release.audio_url)
        audio.play()
        audio.onended = () => setCurrentlyPlaying(null)
        setAudioRef(audio)
        setCurrentlyPlaying('main')
      }
      return
    }

    // Handle track audio
    if (trackId && audioUrl) {
      if (currentlyPlaying === trackId) {
        audioRef?.pause()
        setCurrentlyPlaying(null)
      } else {
        if (audioRef) {
          audioRef.pause()
        }
        const audio = new Audio(audioUrl)
        audio.play()
        audio.onended = () => setCurrentlyPlaying(null)
        setAudioRef(audio)
        setCurrentlyPlaying(trackId)
      }
    }
  }

  const handleDownload = async () => {
    if (!release?.audio_url) return
    
    try {
      const response = await fetch(release.audio_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${release.title}.mp3`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Download started")
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download file")
    }
  }

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({
        title: release?.title,
        url: url,
      }).catch(() => {
        navigator.clipboard.writeText(url)
        toast.success("Link copied to clipboard")
      })
    } else {
      navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard")
    }
  }

  const handleDelete = async () => {
    if (!user || !release || !supabase) return
    
    if (!confirm("Are you sure you want to delete this release? This action cannot be undone.")) {
      return
    }

    try {
      const { error } = await supabase
        .from("releases")
        .delete()
        .eq("id", release.id)
        .eq("user_id", user.id)

      if (error) throw error

      toast.success("Release deleted successfully")
      router.push("/releases")
    } catch (error) {
      console.error("Error deleting release:", error)
      toast.error("Failed to delete release")
    }
  }

  const handleTakedownSubmit = async () => {
    if (!user || !release || !takedownReason || !supabase) return

    setSubmittingTakedown(true)
    try {
      const { error } = await supabase
        .from('user_takedown_requests')
        .insert({
          user_id: user.id,
          release_id: release.id,
          reason: takedownReason,
          details: takedownDetails,
          status: 'pending'
        })

      if (error) throw error

      toast.success('Takedown request submitted successfully')
      setShowTakedownDialog(false)
      setTakedownReason('')
      setTakedownDetails('')
      
      // Refresh to show new takedown status
      await checkExistingTakedown(release.id)
    } catch (error) {
      console.error('Error submitting takedown:', error)
      toast.error('Failed to submit takedown request')
    } finally {
      setSubmittingTakedown(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-gray-600" },
      pending: { label: "Pending", className: "bg-yellow-600" },
      processing: { label: "Processing", className: "bg-blue-600" },
      live: { label: "Live", className: "bg-green-600" },
      rejected: { label: "Rejected", className: "bg-red-600" },
      taken_down: { label: "Taken Down", className: "bg-gray-700" }
    }
    
    const config = statusConfig[status] || statusConfig.draft
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen bg-gray-950">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <CustomLoader size="lg" />
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!release) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen bg-gray-950">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Release not found</p>
              <Button onClick={() => router.push("/releases")} className="mt-4">
                Back to Releases
              </Button>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const takedownStatus = existingTakedown ? getTakedownStatusInfo(existingTakedown.status) : null

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/releases")}
                  className="text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Releases
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="border-gray-700 text-white hover:bg-gray-800"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/releases/${id}/edit`)}
                    className="border-gray-700 text-white hover:bg-gray-800"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sidebar - Cover Art & Actions */}
                <div className="space-y-6">
                  <Card className="card-dark">
                    <CardContent className="p-6">
                      <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-800 mb-6">
                        {release.cover_art_url ? (
                          <Image
                            src={release.cover_art_url}
                            alt={release.title || "Release artwork"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Music className="w-24 h-24 text-gray-600" />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h1 className="text-2xl font-bold text-white mb-2">{release.title}</h1>
                          <p className="text-gray-400 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {release.artist_name}
                          </p>
                          {metadata.featuredArtist && (
                            <p className="text-gray-500 text-sm mt-1">
                              feat. {metadata.featuredArtist}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {getStatusBadge(release.status || 'draft')}
                          {(release.explicit || metadata.explicit) && (
                            <Badge variant="outline" className="border-red-500 text-red-400">
                              Explicit
                            </Badge>
                          )}
                        </div>

                        {/* Takedown Status Badge */}
                        {takedownStatus && (
                          <div className={`p-3 rounded-lg border ${takedownStatus.borderColor} ${takedownStatus.color}/10`}>
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="w-4 h-4 text-white" />
                              <p className="text-white text-sm font-semibold">{takedownStatus.label}</p>
                            </div>
                            <p className="text-gray-300 text-xs">{takedownStatus.description}</p>
                            {existingTakedown?.admin_notes && (
                              <div className="mt-2 pt-2 border-t border-gray-700">
                                <p className="text-xs text-gray-400">Admin Notes:</p>
                                <p className="text-xs text-gray-300 mt-1">{existingTakedown.admin_notes}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          {release.audio_url && (
                            <>
                              <Button
                                onClick={() => handlePlayPause()}
                                className="w-full button-primary"
                              >
                                {currentlyPlaying === 'main' ? (
                                  <>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Pause
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Play
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={handleDownload}
                                className="w-full button-secondary"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </>
                          )}
                          
                          <Button
                            variant="destructive"
                            onClick={handleDelete}
                            className="w-full"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Release
                          </Button>

                          {/* Takedown Button - Only show if no existing takedown or if rejected */}
                          {(!existingTakedown || existingTakedown.status === 'rejected') && (
                            <Dialog open={showTakedownDialog} onOpenChange={setShowTakedownDialog}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                                >
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  Request Takedown
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="card-dark border-gray-700">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Request Takedown</DialogTitle>
                                  <DialogDescription className="text-gray-400">
                                    Submit a request to remove this release from distribution platforms.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label className="text-white">Reason for Takedown</Label>
                                    <Select value={takedownReason} onValueChange={setTakedownReason}>
                                      <SelectTrigger className="input-dark">
                                        <SelectValue placeholder="Select a reason" />
                                      </SelectTrigger>
                                      <SelectContent className="glass border-gray-800">
                                        {TAKEDOWN_REASONS.map((reason) => (
                                          <SelectItem key={reason.value} value={reason.value} className="text-gray-200">
                                            {reason.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-white">Additional Details</Label>
                                    <Textarea
                                      value={takedownDetails}
                                      onChange={(e) => setTakedownDetails(e.target.value)}
                                      placeholder="Please provide additional details about the takedown request..."
                                      className="input-dark"
                                    />
                                  </div>
                                  <div className="flex gap-3 pt-4">
                                    <Button
                                      onClick={handleTakedownSubmit}
                                      disabled={!takedownReason || submittingTakedown}
                                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      {submittingTakedown ? (
                                        <>
                                          <CustomLoader size="sm" />
                                          Submitting...
                                        </>
                                      ) : (
                                        'Submit Takedown Request'
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => setShowTakedownDialog(false)}
                                      className="border-gray-700 text-white hover:bg-gray-800"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content - Tabs */}
                <div className="lg:col-span-2">
                  <Tabs defaultValue="details" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="tracks">Tracks</TabsTrigger>
                      <TabsTrigger value="platforms">Platforms</TabsTrigger>
                      <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>

                    {/* Details Tab */}
                    <TabsContent value="details" className="space-y-6">
                      {/* Basic Information */}
                      <Card className="card-dark">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Release Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-gray-400 text-sm">Title</Label>
                              <p className="text-white">{release.title || "Not specified"}</p>
                            </div>
                            <div>
                              <Label className="text-gray-400 text-sm">Artist</Label>
                              <p className="text-white flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {release.artist_name || "Not specified"}
                              </p>
                            </div>
                            {metadata.displayArtist && (
                              <div>
                                <Label className="text-gray-400 text-sm">Display Artist</Label>
                                <p className="text-white">{metadata.displayArtist}</p>
                              </div>
                            )}
                            {metadata.featuredArtist && (
                              <div>
                                <Label className="text-gray-400 text-sm">Featured Artist</Label>
                                <p className="text-white">{metadata.featuredArtist}</p>
                              </div>
                            )}
                            <div>
                              <Label className="text-gray-400 text-sm">Primary Genre</Label>
                              <p className="text-white">{release.genre || metadata.mainGenre || "Not specified"}</p>
                            </div>
                            {metadata.subGenre && (
                              <div>
                                <Label className="text-gray-400 text-sm">Secondary Genre</Label>
                                <p className="text-white">{metadata.subGenre}</p>
                              </div>
                            )}
                            <div>
                              <Label className="text-gray-400 text-sm">Release Type</Label>
                              <p className="text-white capitalize">{metadata.releaseType || "single"}</p>
                            </div>
                            <div>
                              <Label className="text-gray-400 text-sm">Language</Label>
                              <p className="text-white uppercase">{metadata.language || "EN"}</p>
                            </div>
                            <div>
                              <Label className="text-gray-400 text-sm">Release Date</Label>
                              <p className="text-white flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {release.release_date ? new Date(release.release_date).toLocaleDateString() : "Not set"}
                              </p>
                            </div>
                            <div>
                              <Label className="text-gray-400 text-sm">Created</Label>
                              <p className="text-white">{new Date(release.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <Label className="text-gray-400 text-sm">Last Updated</Label>
                              <p className="text-white">{new Date(release.updated_at).toLocaleDateString()}</p>
                            </div>
                          </div>

                          {release.description && (
                            <div>
                              <Label className="text-gray-400 text-sm">Description</Label>
                              <p className="text-white mt-1">{release.description}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Credits & Metadata */}
                      <Card className="card-dark">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <Tag className="w-5 h-5" />
                            Credits & Metadata
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {metadata.lyricist && (
                              <div>
                                <Label className="text-gray-400 text-sm">Lyricist</Label>
                                <p className="text-white">{metadata.lyricist}</p>
                              </div>
                            )}
                            {metadata.composer && (
                              <div>
                                <Label className="text-gray-400 text-sm">Composer</Label>
                                <p className="text-white">{metadata.composer}</p>
                              </div>
                            )}
                            {metadata.recordLabel && (
                              <div>
                                <Label className="text-gray-400 text-sm">Record Label</Label>
                                <p className="text-white">{metadata.recordLabel}</p>
                              </div>
                            )}
                            {metadata.publisher && (
                              <div>
                                <Label className="text-gray-400 text-sm">Publisher</Label>
                                <p className="text-white">{metadata.publisher}</p>
                              </div>
                            )}
                            {metadata.upc && (
                              <div>
                                <Label className="text-gray-400 text-sm">UPC</Label>
                                <p className="text-white font-mono">{metadata.upc}</p>
                              </div>
                            )}
                            {metadata.catNumber && (
                              <div>
                                <Label className="text-gray-400 text-sm">Catalog Number</Label>
                                <p className="text-white font-mono">{metadata.catNumber}</p>
                              </div>
                            )}
                            {metadata.pLine && (
                              <div>
                                <Label className="text-gray-400 text-sm">P Line</Label>
                                <p className="text-white">{metadata.pLine}</p>
                              </div>
                            )}
                            {metadata.cLine && (
                              <div>
                                <Label className="text-gray-400 text-sm">C Line</Label>
                                <p className="text-white">{metadata.cLine}</p>
                              </div>
                            )}
                            {metadata.copyrightYear && (
                              <div>
                                <Label className="text-gray-400 text-sm">Copyright Year</Label>
                                <p className="text-white">{metadata.copyrightYear}</p>
                              </div>
                            )}
                            {metadata.priceTier && (
                              <div>
                                <Label className="text-gray-400 text-sm">Price Tier</Label>
                                <p className="text-white">${metadata.priceTier}</p>
                              </div>
                            )}
                          </div>

                          {metadata.tags && metadata.tags.length > 0 && (
                            <div>
                              <Label className="text-gray-400 text-sm mb-2 block">Tags</Label>
                              <div className="flex flex-wrap gap-2">
                                {metadata.tags.map((tag: string, index: number) => (
                                  <Badge key={index} variant="outline" className="border-gray-600 text-gray-300">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Tracks Tab */}
                    <TabsContent value="tracks" className="space-y-6">
                      <Card className="card-dark">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <ListMusic className="w-5 h-5" />
                            Tracklist ({tracks.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {tracks.length > 0 ? (
                            <div className="space-y-3">
                              {tracks.map((track, index) => (
                                <div
                                  key={track.id}
                                  className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
                                >
                                  <div className="flex items-center gap-4">
                                    <span className="text-gray-400 font-mono text-sm w-6">
                                      {(index + 1).toString().padStart(2, '0')}
                                    </span>
                                    
                                    {track.audioUrl && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handlePlayPause(track.id, track.audioUrl)}
                                        className="p-2 hover:bg-gray-700"
                                      >
                                        {currentlyPlaying === track.id ? (
                                          <Pause className="w-4 h-4" />
                                        ) : (
                                          <Play className="w-4 h-4" />
                                        )}
                                      </Button>
                                    )}

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="text-white font-medium truncate">{track.title}</p>
                                        {track.explicit && (
                                          <Badge variant="outline" className="border-red-500 text-red-400 text-xs">
                                            E
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 text-sm text-gray-400">
                                        <span>{track.artist}</span>
                                        {track.featuredArtist && (
                                          <>
                                            <span>•</span>
                                            <span>feat. {track.featuredArtist}</span>
                                          </>
                                        )}
                                        {track.duration > 0 && (
                                          <>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                              <Clock className="w-3 h-3" />
                                              {formatDuration(track.duration)}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                      {track.isrc && (
                                        <p className="text-xs text-gray-500 font-mono mt-1">ISRC: {track.isrc}</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Additional track details */}
                                  {(track.mainGenre || track.lyricist || track.composer) && (
                                    <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                      {track.mainGenre && (
                                        <div>
                                          <span className="text-gray-500">Genre:</span>
                                          <span className="text-gray-300 ml-2">{track.mainGenre}</span>
                                        </div>
                                      )}
                                      {track.lyricist && (
                                        <div>
                                          <span className="text-gray-500">Lyricist:</span>
                                          <span className="text-gray-300 ml-2">{track.lyricist}</span>
                                        </div>
                                      )}
                                      {track.composer && (
                                        <div>
                                          <span className="text-gray-500">Composer:</span>
                                          <span className="text-gray-300 ml-2">{track.composer}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {track.lyrics && (
                                    <details className="mt-3 pt-3 border-t border-gray-700">
                                      <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                                        View Lyrics
                                      </summary>
                                      <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">
                                        {track.lyrics}
                                      </p>
                                    </details>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <Headphones className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                              <p className="text-gray-400">No tracks available</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Platforms Tab */}
                    <TabsContent value="platforms" className="space-y-6">
                      <Card className="card-dark">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            Distribution Platforms
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {release.platforms && release.platforms.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {release.platforms.map((platform: any, index: number) => {
                                // Format platform name: "apple-music" -> "Apple Music"
                                const platformName = String(platform)
                                  .split('-')
                                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(' ')
                                
                                return (
                                  <div
                                    key={platform || index}
                                    className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                                      <div>
                                        <p className="text-white font-medium">
                                          {platformName}
                                        </p>
                                        <p className="text-xs text-gray-400">Active</p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                              <p className="text-gray-400">No platforms selected for distribution</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {metadata.selectedProducts && metadata.selectedProducts.length > 0 && (
                        <Card className="card-dark">
                          <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                              <Star className="w-5 h-5" />
                              Additional Services
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {metadata.selectedProducts.map((product: string) => (
                                <div
                                  key={product}
                                  className="p-3 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-lg border border-purple-500/20"
                                >
                                  <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-purple-400" />
                                    <span className="text-white">{product}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value="analytics" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="card-dark">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-400 text-sm">Total Streams</p>
                                <p className="text-2xl font-bold text-white">{formatNumber(release.streams || 0)}</p>
                              </div>
                              <TrendingUp className="w-8 h-8 text-blue-400" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="card-dark">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-400 text-sm">Total Revenue</p>
                                <p className="text-2xl font-bold text-white">${(release.revenue || 0).toFixed(2)}</p>
                              </div>
                              <DollarSign className="w-8 h-8 text-green-400" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="card-dark">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-400 text-sm">Platforms</p>
                                <p className="text-2xl font-bold text-white">{release.platforms?.length || 0}</p>
                              </div>
                              <Globe className="w-8 h-8 text-purple-400" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}