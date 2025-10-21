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
  DollarSign
} from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

type Release = Database["public"]["Tables"]["releases"]["Row"]

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
  const [currentlyPlaying, setCurrentlyPlaying] = useState(false)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)
  const [showTakedownDialog, setShowTakedownDialog] = useState(false)
  const [takedownReason, setTakedownReason] = useState('')
  const [takedownDetails, setTakedownDetails] = useState('')
  const [submittingTakedown, setSubmittingTakedown] = useState(false)
  const [existingTakedown, setExistingTakedown] = useState<any>(null)
  const [checkingTakedown, setCheckingTakedown] = useState(false)

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

  const togglePlayback = () => {
    if (!release?.audio_url) {
      toast.error("No audio file available for this release")
      return
    }

    if (currentlyPlaying && audioRef) {
      audioRef.pause()
      setCurrentlyPlaying(false)
    } else {
      try {
        const audio = new Audio(release.audio_url)
        
        audio.onended = () => setCurrentlyPlaying(false)
        audio.onerror = (e) => {
          console.error("Error playing audio:", e)
          setCurrentlyPlaying(false)
          toast.error("Playback failed - audio file may be corrupted or unavailable")
        }
        
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setCurrentlyPlaying(true)
              setAudioRef(audio)
            })
            .catch((error) => {
              console.error("Error starting playback:", error)
              setCurrentlyPlaying(false)
              
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
      }
    }
  }

  /**
   * Handles takedown request submission directly through Supabase
   * 
   * Process:
   * 1. Validates required fields (reason, release, user)
   * 2. Inserts takedown request into user_takedown_requests table
   * 3. Creates a notification for the user
   * 4. Handles success/error states with appropriate user feedback
   * 
   * Why direct Supabase call:
   * - Eliminates unnecessary API route overhead
   * - Leverages Supabase RLS for authorization (now disabled for testing)
   * - Reduces latency by removing the middleware layer
   * - Simpler error handling and debugging
   */
  const handleTakedownSubmit = async () => {
    if (!takedownReason || !release || !user || !supabase) {
      toast.error('Missing required information')
      return
    }

    setSubmittingTakedown(true)

    try {
      // Check if a takedown request already exists for this release
      const { data: existingRequest } = await supabase
        .from('user_takedown_requests')
        .select('id')
        .eq('release_id', release.id)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single()

      if (existingRequest) {
        toast.error('A pending takedown request already exists for this release')
        setSubmittingTakedown(false)
        return
      }

      // Insert takedown request directly into Supabase
      const { data: takedownRequest, error: insertError } = await supabase
        .from('user_takedown_requests')
        .insert({
          user_id: user.id,
          release_id: release.id,
          release_title: release.title,
          artist_name: release.artist_name,
          reason: takedownReason,
          detailed_reason: takedownDetails || null,
          urgency: 'normal',
          platforms: release.platforms || [],
          status: 'pending'
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating takedown request:', insertError)
        toast.error('Failed to submit takedown request')
        return
      }

      if (!takedownRequest) {
        toast.error('Failed to create takedown request')
        return
      }

      // Create notification for the user
      // Using a separate call so if this fails, the takedown request still exists
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'takedown_request_submitted',
          title: 'Takedown Request Submitted',
          message: `Your takedown request for "${release.title}" has been submitted and is pending review.`,
          read: false
        })

      // Log but don't fail if notification creation fails
      // The takedown request is more important than the notification
      if (notificationError) {
        console.error('Error creating notification:', notificationError)
      }

      // Success - reset form and close dialog
      toast.success('Takedown request submitted successfully!')
      setShowTakedownDialog(false)
      setTakedownReason('')
      setTakedownDetails('')

      console.log('Takedown request created:', takedownRequest.id)

    } catch (error) {
      console.error('Unexpected error submitting takedown request:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setSubmittingTakedown(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "live":
        return <Badge className="bg-green-600 text-white">Live</Badge>
      case "pending":
        return <Badge className="bg-yellow-600 text-white">Pending</Badge>
      case "pending_edit":
        return <Badge className="bg-orange-600 text-white">Pending Edit</Badge>
      case "processing":
        return <Badge className="bg-blue-600 text-white">Processing</Badge>
      case "failed":
        return <Badge className="bg-red-600 text-white">Failed</Badge>
      default:
        return <Badge className="bg-gray-600 text-white">Unknown</Badge>
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen bg-gray-950">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-6">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-center min-h-[400px]">
                  <CustomLoader size="lg" showText text="Loading release..." />
                </div>
              </div>
            </main>
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
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-6">
              <div className="max-w-6xl mx-auto">
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-white mb-4">Release Not Found</h2>
                  <p className="text-gray-400 mb-6">The release you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
                  <Button onClick={() => router.push("/releases")} className="button-primary">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Releases
                  </Button>
                </div>
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
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/releases")}
                  className="text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Releases
                </Button>
              </div>

              {/* Release Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <Card className="card-dark">
                    <CardContent className="p-6">
                      <div className="aspect-square relative mb-4 rounded-lg overflow-hidden bg-gray-800">
                        {release.cover_art_url ? (
                          <Image
                            src={release.cover_art_url}
                            alt={release.title || "Release artwork"}
                            fill
                            className="object-cover"
                            unoptimized={true}
                            onError={(e) => {
                              console.error('Image failed to load:', release.cover_art_url)
                              e.currentTarget.style.display = 'none'
                              const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon') as HTMLElement
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div className="fallback-icon flex items-center justify-center h-full" style={{ display: release.cover_art_url ? 'none' : 'flex' }}>
                          <Music className="w-16 h-16 text-gray-600" />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h1 className="text-2xl font-bold text-white mb-2">{release.title}</h1>
                          <p className="text-lg text-gray-300">{release.artist_name}</p>
                          <div className="mt-2">{getStatusBadge(release.status)}</div>
                        </div>

                        <div className="flex gap-2">
                          {release.audio_url && (
                            <Button
                              onClick={togglePlayback}
                              className="flex-1 button-primary"
                            >
                              {currentlyPlaying ? (
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
                          )}
                          <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/releases/${release.id}/edit`)}
                            className="flex-1 border-gray-700 text-white hover:bg-gray-800"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          
                          {/* Show Takedown Status or Button */}
                          {checkingTakedown ? (
                            <Button 
                              variant="outline" 
                              disabled
                              className="border-gray-700 text-gray-400"
                            >
                              <CustomLoader size="sm" />
                            </Button>
                          ) : existingTakedown ? (
                            // Show existing takedown status
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  className={`border-gray-700 text-white hover:bg-gray-800 ${
                                    getTakedownStatusInfo(existingTakedown.status).borderColor
                                  }`}
                                >
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  View Takedown
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="card-dark border-gray-700">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Takedown Request Status</DialogTitle>
                                  <DialogDescription className="text-gray-400">
                                    View the status of your takedown request
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className={`p-4 bg-gray-800 rounded-lg border-l-4 ${getTakedownStatusInfo(existingTakedown.status).borderColor}`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <Badge className={getTakedownStatusInfo(existingTakedown.status).color}>
                                        {getTakedownStatusInfo(existingTakedown.status).label}
                                      </Badge>
                                      <span className="text-gray-400 text-xs">
                                        {new Date(existingTakedown.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-gray-300 text-sm mb-3">
                                      {getTakedownStatusInfo(existingTakedown.status).description}
                                    </p>
                                    
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <span className="text-gray-400">Reason:</span>
                                        <span className="text-white ml-2 capitalize">
                                          {existingTakedown.reason.replace('_', ' ')}
                                        </span>
                                      </div>
                                      
                                      {existingTakedown.detailed_reason && (
                                        <div>
                                          <span className="text-gray-400">Details:</span>
                                          <p className="text-gray-300 mt-1">{existingTakedown.detailed_reason}</p>
                                        </div>
                                      )}
                                      
                                      {existingTakedown.platforms && existingTakedown.platforms.length > 0 && (
                                        <div>
                                          <span className="text-gray-400">Platforms:</span>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {existingTakedown.platforms.map((platform: string) => (
                                              <Badge key={platform} variant="outline" className="text-xs">
                                                {platform}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {existingTakedown.admin_notes && (
                                        <div className="mt-3 p-3 bg-yellow-900/20 rounded border-l-2 border-yellow-600">
                                          <span className="text-yellow-400 text-xs font-medium">Admin Notes:</span>
                                          <p className="text-gray-300 mt-1">{existingTakedown.admin_notes}</p>
                                        </div>
                                      )}
                                      
                                      {existingTakedown.completed_at && (
                                        <div className="text-xs text-gray-500 mt-2">
                                          Completed: {new Date(existingTakedown.completed_at).toLocaleString()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {existingTakedown.status === 'rejected' && (
                                    <Button
                                      onClick={() => {
                                        setExistingTakedown(null)
                                        setShowTakedownDialog(true)
                                      }}
                                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      Submit New Takedown Request
                                    </Button>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            // Show takedown button if no existing request
                            <Dialog open={showTakedownDialog} onOpenChange={setShowTakedownDialog}>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="border-red-700 text-red-400 hover:bg-red-900/20">
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  Takedown
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

                <div className="lg:col-span-2">
                  <Tabs defaultValue="details" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="analytics">Analytics</TabsTrigger>
                      <TabsTrigger value="platforms">Platforms</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-6">
                      <Card className="card-dark">
                        <CardHeader>
                          <CardTitle className="text-white">Release Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-gray-400">Genre</Label>
                              <p className="text-white">{release.genre || "Not specified"}</p>
                            </div>
                            <div>
                              <Label className="text-gray-400">Release Date</Label>
                              <p className="text-white flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {release.release_date ? new Date(release.release_date).toLocaleDateString() : "Not set"}
                              </p>
                            </div>
                            <div>
                              <Label className="text-gray-400">Created</Label>
                              <p className="text-white">{new Date(release.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <Label className="text-gray-400">Last Updated</Label>
                              <p className="text-white">{new Date(release.updated_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

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

                    <TabsContent value="platforms" className="space-y-6">
                      <Card className="card-dark">
                        <CardHeader>
                          <CardTitle className="text-white">Distribution Platforms</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {release.platforms && release.platforms.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {release.platforms.map((platform: string) => (
                                <div key={platform} className="p-3 bg-gray-800/50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                                    <span className="text-white capitalize">{platform.replace('-', ' ')}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                              <p className="text-gray-400">No platforms selected for distribution</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
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