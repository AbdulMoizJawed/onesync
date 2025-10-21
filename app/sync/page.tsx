"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CustomLoader from "@/components/ui/custom-loader"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  Globe, 
  Play, 
  DollarSign, 
  Calendar, 
  Users, 
  Search,
  Filter,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Music,
  Film,
  Tv,
  Radio
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { OptimizedImage } from "@/components/optimized-image"

type SyncOpportunity = {
  id: string
  title: string
  type: 'film' | 'tv' | 'commercial' | 'game' | 'podcast' | 'other'
  description: string | null
  genre: string | null
  budget_min: number | null
  budget_max: number | null
  status: 'open' | 'closed' | 'urgent'
  deadline: string | null
  requirements: string[]
  submissions_count: number
  created_at: string
  updated_at: string
}

type SyncSubmission = {
  id: string
  user_id: string
  release_id: string
  opportunity_id: string
  status: 'submitted' | 'reviewed' | 'shortlisted' | 'rejected' | 'licensed'
  feedback: string | null
  created_at: string
  updated_at: string
  opportunity?: SyncOpportunity
  release?: {
    title: string
    artist_name: string
    cover_art_url: string | null
  }
}

export default function SyncPage() {
  const { user } = useAuth()
  const [opportunities, setOpportunities] = useState<SyncOpportunity[]>([])
  const [submissions, setSubmissions] = useState<SyncSubmission[]>([])
  const [releases, setReleases] = useState<any[]>([])
  const [submittedCombinations, setSubmittedCombinations] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<SyncOpportunity | null>(null)
  const [selectedRelease, setSelectedRelease] = useState<string>("")
  const [submissionNotes, setSubmissionNotes] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        fetchOpportunities(),
        fetchSubmissions(),
        fetchReleases(),
        fetchSubmittedCombinations()
      ])
    } catch (err) {
      console.error("Error fetching sync data:", err)
      setError("Failed to load sync opportunities")
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, fetchData])

  const fetchOpportunities = async () => {
    if (!supabase) return

    const { data, error } = await supabase
      .from("sync_opportunities")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setOpportunities(data)
    }
  }

  const fetchSubmissions = async () => {
    if (!user || !supabase) return

    const { data, error } = await supabase
      .from("sync_submissions")
      .select(`
        *,
        opportunity:sync_opportunities(*),
        release:releases(title, artist_name, cover_art_url)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setSubmissions(data as SyncSubmission[])
    }
  }

  const fetchReleases = async () => {
    if (!user || !supabase) return

    const { data, error } = await supabase
      .from("releases")
      .select("id, title, artist_name, cover_art_url, status")
      .eq("user_id", user.id)
      .in("status", ["live", "processing", "draft"]) // allow more statuses so list isn't empty

    if (!error && data) {
      setReleases(data)
    }
  }

  const fetchSubmittedCombinations = async () => {
    if (!user || !supabase) return

    const { data, error } = await supabase
      .from("sync_submissions")
      .select("release_id, opportunity_id")
      .eq("user_id", user.id)

    if (!error && data) {
      const combinationSet = new Set(
        data.map(sub => `${sub.release_id}-${sub.opportunity_id}`)
      )
      setSubmittedCombinations(combinationSet)
    }
  }

  const isAlreadySubmitted = (releaseId: string, opportunityId: string) => {
    return submittedCombinations.has(`${releaseId}-${opportunityId}`)
  }

  const hasAnySubmissionToOpportunity = (opportunityId: string) => {
    return Array.from(submittedCombinations).some(combo => 
      combo.endsWith(`-${opportunityId}`)
    )
  }

  const submitToOpportunity = async () => {
    if (!user || !supabase || !selectedOpportunity || !selectedRelease) {
      setError("Please select a release")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Check if this combination already exists
      const { data: existingSubmission, error: checkError } = await supabase
        .from("sync_submissions")
        .select("id")
        .eq("user_id", user.id)
        .eq("release_id", selectedRelease)
        .eq("opportunity_id", selectedOpportunity.id)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 means no rows found, which is what we want
        throw checkError
      }

      if (existingSubmission) {
        setError("You have already submitted this release to this opportunity")
        setSubmitting(false)
        return
      }

      const { error: submitError } = await supabase
        .from("sync_submissions")
        .insert({
          user_id: user.id,
          release_id: selectedRelease,
          opportunity_id: selectedOpportunity.id
        })

      if (submitError) {
        // Check if it's a unique constraint violation
        if (submitError.code === "23505" || submitError.message?.includes("unique_sync_submission")) {
          setError("You have already submitted this release to this opportunity")
          setSubmitting(false)
          return
        }
        throw submitError
      }

      // Update submissions count
      await supabase
        .from("sync_opportunities")
        .update({ 
          submissions_count: selectedOpportunity.submissions_count + 1 
        })
        .eq("id", selectedOpportunity.id)

      setShowSubmitDialog(false)
      setSelectedRelease("")
      setSubmissionNotes("")
      await fetchData()
      
      alert("Submission sent successfully!")
    } catch (err: any) {
      console.error("Error submitting:", err)
      setError(`Failed to submit: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         opp.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === "all" || opp.type === selectedType
    return matchesSearch && matchesType
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'film': return <Film className="w-4 h-4" />
      case 'tv': return <Tv className="w-4 h-4" />
      case 'commercial': return <Radio className="w-4 h-4" />
      case 'game': return <Play className="w-4 h-4" />
      default: return <Music className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'urgent': return 'bg-red-600'
      case 'open': return 'bg-green-600'
      case 'closed': return 'bg-gray-600'
      default: return 'bg-blue-600'
    }
  }

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'licensed': return 'bg-green-600'
      case 'shortlisted': return 'bg-blue-600'
      case 'reviewed': return 'bg-yellow-600'
      case 'rejected': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-3 sm:p-4 lg:p-6 mobile-safe-area">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-white">
                  Sync Opportunities
                </h1>
                <p className="text-sm sm:text-base text-gray-400">
                  Connect your music with film, TV, commercials, and more
                </p>
              </div>

              {error && (
                <Alert className="mb-6 border-red-500/50 bg-red-500/10 backdrop-blur-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="opportunities" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-900 mb-6 rounded-lg">
                  <TabsTrigger 
                    value="opportunities" 
                    className="data-[state=active]:bg-gray-800 data-[state=active]:text-white flex items-center justify-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">Browse Opportunities</span>
                    <span className="sm:hidden">Browse</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="submissions" 
                    className="data-[state=active]:bg-gray-800 data-[state=active]:text-white flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">My Submissions</span>
                    <span className="sm:hidden">Submissions</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="opportunities" className="space-y-6">
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search opportunities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="bg-gray-800 border border-gray-700 text-white rounded-md px-4 py-2 focus:border-gray-600 focus:outline-none"
                    >
                      <option value="all">All Types</option>
                      <option value="film">Film</option>
                      <option value="tv">TV Show</option>
                      <option value="commercial">Commercial</option>
                      <option value="game">Video Game</option>
                      <option value="podcast">Podcast</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-16">
                      <CustomLoader size="lg" text="Loading opportunities..." showText={true} />
                        </div>
                  ) : filteredOpportunities.length > 0 ? (
                    <div className="grid gap-4">
                      {filteredOpportunities.map((opportunity) => (
                        <Card key={opportunity.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                          <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="p-2 bg-gray-800 rounded">
                                    {getTypeIcon(opportunity.type)}
                                  </div>
                                  <CardTitle className="text-lg font-bold text-white">
                                    {opportunity.title}
                                  </CardTitle>
                                  <Badge className={`${getStatusColor(opportunity.status)} text-white text-xs`}>
                                    {opportunity.status.toUpperCase()}
                                  </Badge>
                                </div>
                                {opportunity.description && (
                                  <CardDescription className="text-gray-400 text-sm">
                                    {opportunity.description}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                              {opportunity.genre && (
                                <span className="flex items-center gap-1">
                                  <Music className="w-4 h-4" />
                                  {opportunity.genre}
                                </span>
                              )}
                              {opportunity.budget_min && opportunity.budget_max && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  ${opportunity.budget_min.toLocaleString()} - ${opportunity.budget_max.toLocaleString()}
                                </span>
                              )}
                              {opportunity.deadline && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(opportunity.deadline).toLocaleDateString()}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {opportunity.submissions_count} submissions
                              </span>
                            </div>
                            
                            <div className="flex justify-end">
                              {hasAnySubmissionToOpportunity(opportunity.id) ? (
                                <div className="flex items-center gap-2 text-green-400 text-sm">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Submitted</span>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => {
                                    setSelectedOpportunity(opportunity)
                                    setShowSubmitDialog(true)
                                  }}
                                  size="sm"
                                  className="bg-white hover:bg-gray-100 text-gray-950"
                                  disabled={opportunity.status === 'closed'}
                                >
                                  Submit Music
                                </Button>
                              )}
                            </div>
                            
                            {opportunity.requirements.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-800">
                                <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4" />
                                  Requirements
                                </h4>
                                <ul className="space-y-1">
                                  {opportunity.requirements.map((req, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
                                      <div className="w-1 h-1 bg-gray-600 rounded-full mt-2"></div>
                                      <span>{req}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Globe className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No Opportunities Found</h3>
                      <p className="text-gray-400 text-sm mb-4">
                        {searchQuery || selectedType !== "all" 
                          ? "Try adjusting your search criteria"
                          : "Check back soon for new opportunities"}
                      </p>
                      {(searchQuery || selectedType !== "all") && (
                        <Button 
                          onClick={() => {
                            setSearchQuery("")
                            setSelectedType("all")
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="submissions" className="space-y-4">
                  {submissions.length > 0 ? (
                    <div className="grid gap-4">
                      {submissions.map((submission) => (
                        <Card key={submission.id} className="bg-gray-900 border-gray-800">
                          <CardHeader>
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center overflow-hidden">
                                {submission.release?.cover_art_url ? (
                                  <OptimizedImage
                                    src={submission.release.cover_art_url}
                                    alt={submission.release?.title || ''}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                    fallback="music"
                                  />
                                ) : (
                                  <Music className="w-6 h-6 text-gray-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <CardTitle className="text-base font-bold text-white">
                                    {submission.release?.title}
                                  </CardTitle>
                                  <Badge className={`${getSubmissionStatusColor(submission.status)} text-white text-xs`}>
                                    {submission.status.toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-400">
                                  {submission.release?.artist_name} • Submitted to {submission.opportunity?.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(submission.created_at).toLocaleDateString()}
                                </p>
                                {submission.feedback && (
                                  <div className="mt-2 p-2 bg-gray-800 rounded text-sm text-gray-300">
                                    <span className="font-medium">Feedback:</span>
                                    <div className="text-sm text-gray-300">{submission.feedback}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Send className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No Submissions Yet</h3>
                      <p className="text-gray-400 text-sm mb-4">
                        Start submitting your music to opportunities
                      </p>
                      <Button 
                        onClick={() => {
                          const tabs = document.querySelector('[data-state="active"]')?.previousElementSibling as HTMLElement
                          tabs?.click()
                        }}
                        size="sm"
                      >
                        Browse Opportunities
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Submit Dialog */}
            <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
              <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md mx-auto">
                <DialogHeader>
                  <DialogTitle>Submit to Opportunity</DialogTitle>
                  <DialogDescription>
                    Submit your music to "{selectedOpportunity?.title}"
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="release" className="text-gray-400 mb-2 block">
                      Select Release *
                    </Label>
                    <select
                      id="release"
                      value={selectedRelease}
                      onChange={(e) => setSelectedRelease(e.target.value)}
                      className="w-full bg-gray-800 border-gray-600 text-white rounded-md px-3 py-2"
                    >
                      <option value="">Choose a release...</option>
                      {releases
                        .filter(release => !selectedOpportunity || !isAlreadySubmitted(release.id, selectedOpportunity.id))
                        .map((release) => (
                          <option key={release.id} value={release.id}>
                            {release.title} - {release.artist_name}
                          </option>
                        ))}
                    </select>
                    {selectedOpportunity && releases.length > 0 && 
                     releases.filter(release => !isAlreadySubmitted(release.id, selectedOpportunity.id)).length === 0 && (
                      <p className="text-yellow-400 text-sm mt-2">
                        All your releases have already been submitted to this opportunity.
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-gray-400 mb-2 block">
                      Additional Notes (Optional)
                    </Label>
                    <Textarea
                      id="notes"
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="Any additional information about your submission..."
                      rows={3}
                    />
                  </div>

                  {releases.length === 0 && (
                    <Alert className="border-yellow-500 bg-yellow-500/10">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-yellow-400">
                        You need to have live releases to submit. Upload and publish a release first.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setShowSubmitDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={submitToOpportunity}
                    className="button-primary"
                    disabled={submitting || !selectedRelease || releases.length === 0}
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </main>
          </div>
      </div>
    </AuthGuard>
  )
}
