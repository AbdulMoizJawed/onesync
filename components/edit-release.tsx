"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, supabase } from "@/lib/auth"
import type { Database } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import CustomLoader from "@/components/ui/custom-loader"
import { animations } from "@/lib/animations"
import { ArrowLeft, Save, Upload, Music, AlertTriangle } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

type Release = Database["public"]["Tables"]["releases"]["Row"]

interface EditReleaseProps {
  releaseId: string
  onCancel: () => void
  onUpdate: (updatedRelease: Release) => void
}

const GENRES = [
  "Alternative", "Blues", "Classical", "Country", "Dance", "Electronic",
  "Folk", "Hip-Hop", "Jazz", "Latin", "Metal", "Pop", "Punk", "R&B",
  "Reggae", "Rock", "Soul", "World"
]

const PLATFORMS = [
  { id: "spotify", name: "Spotify" },
  { id: "apple-music", name: "Apple Music" },
  { id: "youtube-music", name: "YouTube Music" },
  { id: "amazon-music", name: "Amazon Music" },
  { id: "deezer", name: "Deezer" },
  { id: "tidal", name: "Tidal" },
  { id: "pandora", name: "Pandora" },
  { id: "soundcloud", name: "SoundCloud" }
]

export function EditRelease({ releaseId, onCancel, onUpdate }: EditReleaseProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [release, setRelease] = useState<Release | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    artist_name: "",
    genre: "",
    release_date: "",
    description: ""
  })
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [newCoverArt, setNewCoverArt] = useState<File | null>(null)
  const [newCoverArtPreview, setNewCoverArtPreview] = useState<string | null>(null)

  useEffect(() => {
    if (releaseId && user) {
      fetchRelease()
    }
  }, [releaseId, user])

  const fetchRelease = async () => {
    if (!user || !releaseId) return
    setLoading(true)
    
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      const { data, error } = await supabase
        .from("releases")
        .select("*")
        .eq("id", releaseId)
        .eq("user_id", user.id)
        .single()

      if (error) {
        console.error("Error fetching release:", error)
        toast.error("Failed to load release data")
        onCancel()
      } else {
        setRelease(data)
        setFormData({
          title: data.title || "",
          artist_name: data.artist_name || "",
          genre: data.genre || "",
          release_date: data.release_date || "",
          description: data.description || ""
        })
        setSelectedPlatforms(data.platforms || [])
      }
    } catch (error) {
      console.error("Error fetching release:", error)
      toast.error("Failed to load release data")
      onCancel()
    } finally {
      setLoading(false)
    }
  }

  const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Cover art must be less than 10MB")
        return
      }
      
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file")
        return
      }

      setNewCoverArt(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setNewCoverArtPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePlatformChange = (platformId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms([...selectedPlatforms, platformId])
    } else {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platformId))
    }
  }

  const [showWarningDialog, setShowWarningDialog] = useState(false)

  const handleSaveClick = () => {
    if (!formData.title || !formData.artist_name || !formData.genre) {
      toast.error("Please fill in all required fields")
      return
    }

    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform")
      return
    }

    // Show warning dialog before saving
    setShowWarningDialog(true)
  }

  const handleConfirmSave = async () => {
    if (!user || !release) return

    setShowWarningDialog(false)
    setSaving(true)

    try {
      let coverArtUrl = release.cover_art_url

      // Upload new cover art if provided
      if (newCoverArt) {
        setUploading(true)
        
        if (!supabase) {
          throw new Error('Supabase client not initialized')
        }
        
        const timestamp = Date.now()
        const sanitizedUserId = user.id.replace(/[^a-zA-Z0-9-_]/g, '')
        const coverArtPath = `${sanitizedUserId}/releases/${release.id}/cover-${timestamp}.${newCoverArt.name.split('.').pop()}`

        const { error: uploadError } = await supabase.storage
          .from("releases")
          .upload(coverArtPath, newCoverArt, {
            cacheControl: "3600",
            upsert: true,
          })

        if (uploadError) {
          console.error("Cover art upload error:", uploadError)
          throw new Error(`Cover art upload failed: ${uploadError.message}`)
        }

        const { data: coverArtUrlData } = supabase.storage
          .from("releases")
          .getPublicUrl(coverArtPath)
        
        coverArtUrl = coverArtUrlData.publicUrl
        setUploading(false)
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Create edit request instead of directly updating release
      const { data: editRequest, error } = await supabase
        .from("release_edits")
        .insert({
          user_id: user.id,
          release_id: releaseId,
          edit_type: 'update',
          changes: {
            title: formData.title,
            artist_name: formData.artist_name,
            genre: formData.genre,
            release_date: formData.release_date || null,
            description: formData.description || null,
            platforms: selectedPlatforms,
            cover_art_url: coverArtUrl
          },
          status: 'pending',
          reason: 'User requested release update'
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating edit request:", error)
        throw new Error("Failed to submit edit request")
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Update the release status to show pending edit
      await supabase
        .from("releases")
        .update({
          status: 'pending_edit',
          updated_at: new Date().toISOString()
        })
        .eq("id", releaseId)
        .eq("user_id", user.id)

      toast.success("Edit request submitted successfully! Your changes are pending review.")
      onUpdate({ ...release, status: 'pending_edit' } as any)
      
    } catch (error) {
      console.error("Error saving release:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save release")
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!user || !release) return

    setSavingDraft(true)

    try {
      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          artist_name: formData.artist_name,
          genre: formData.genre,
          release_date: formData.release_date,
          description: formData.description,
          platforms: selectedPlatforms,
          cover_art_url: newCoverArtPreview || release.cover_art_url,
          metadata: {
            original_release_id: releaseId,
            edit_type: 'update'
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Draft saved successfully!")
      } else {
        toast.error(data.error || "Failed to save draft")
      }
    } catch (error) {
      console.error("Error saving draft:", error)
      toast.error("Failed to save draft")
    } finally {
      setSavingDraft(false)
    }
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${animations.dissolveIn}`}>
        <div className="flex items-center justify-center min-h-[400px]">
          <CustomLoader size="lg" showText text="Loading release..." />
        </div>
      </div>
    )
  }

  if (!release) {
    return (
      <div className={`space-y-6 ${animations.dissolveIn}`}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-4 font-montserrat">Release Not Found</h2>
          <p className="text-gray-400 mb-6">The release you're trying to edit doesn't exist or you don't have access to it.</p>
          <Button onClick={onCancel} className="button-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${animations.dissolveIn}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white font-montserrat">Edit Release</h1>
            <p className="text-gray-400">Update your release information</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleSaveDraft}
            disabled={savingDraft || saving || uploading}
            variant="outline"
            className="border-gray-700 text-white hover:bg-gray-800"
          >
            {savingDraft ? (
              <>
                <CustomLoader size="sm" />
                Saving Draft...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>
          <Button
            onClick={handleSaveClick}
            disabled={saving || uploading || savingDraft}
            className="button-primary"
          >
            {saving || uploading ? (
              <>
                <CustomLoader size="sm" />
                {uploading ? "Uploading..." : "Submitting..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Submit Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Cover Art */}
        <div className="lg:col-span-1">
          <Card className="card-dark">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-white text-lg sm:text-xl">Cover Art</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-800 max-w-sm mx-auto lg:max-w-none lg:mx-0">
                {newCoverArtPreview ? (
                  <Image
                    src={newCoverArtPreview}
                    alt="New cover art preview"
                    fill
                    className="object-cover"
                  />
                ) : release.cover_art_url ? (
                  <Image
                    src={release.cover_art_url}
                    alt={release.title || "Release artwork"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Music className="w-16 h-16 text-gray-600" />
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-white text-sm">Upload New Cover Art (Optional)</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverArtChange}
                    className="hidden"
                    id="cover-art-upload"
                  />
                  <Label
                    htmlFor="cover-art-upload"
                    className="flex items-center justify-center w-full p-3 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors text-sm"
                  >
                    <Upload className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-400">Choose new image</span>
                  </Label>
                </div>
                <p className="text-xs text-gray-500 mt-2">Recommended: 1400x1400px, max 10MB</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Fields */}
        <div className="lg:col-span-2">
          <Card className="card-dark">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-white text-lg sm:text-xl">Release Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white text-sm">Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-dark"
                    placeholder="Enter release title"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white text-sm">Artist Name *</Label>
                  <Input
                    value={formData.artist_name}
                    onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
                    className="input-dark"
                    placeholder="Enter artist name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white text-sm">Genre *</Label>
                  <Select value={formData.genre} onValueChange={(value) => setFormData({ ...formData, genre: value })}>
                    <SelectTrigger className="input-dark">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent className="glass border-gray-800 max-h-40 overflow-y-auto">
                      {GENRES.map((genre) => (
                        <SelectItem key={genre} value={genre} className="text-gray-200 text-sm">
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Release Date</Label>
                  <Input
                    type="date"
                    value={formData.release_date}
                    onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                    className="input-dark"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-dark"
                  placeholder="Optional description of your release"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <Label className="text-white">Distribution Platforms *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PLATFORMS.map((platform) => (
                    <div key={platform.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={platform.id}
                        checked={selectedPlatforms.includes(platform.id)}
                        onCheckedChange={(checked) => handlePlatformChange(platform.id, checked as boolean)}
                        className="border-gray-600 data-[state=checked]:bg-purple-600"
                      />
                      <Label htmlFor={platform.id} className="text-gray-300 text-sm">
                        {platform.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warning Dialog */}
        <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
                Release Edit Review Required
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Important information about editing your release
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                <p className="text-yellow-300 text-sm font-medium mb-2">⚠️ Changes Require Review</p>
                <p className="text-gray-300 text-sm">
                  Your release changes will need to be reviewed by our admin team before being approved.
                </p>
              </div>

              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                <p className="text-blue-300 text-sm font-medium mb-2">🔄 Resubmission to Stores</p>
                <p className="text-gray-300 text-sm">
                  Once approved, your updated release will be resubmitted to all selected distribution platforms (Spotify, Apple Music, etc.). This process typically takes 24-72 hours.
                </p>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p className="text-white text-sm font-medium mb-2">📋 What happens next:</p>
                <ul className="text-gray-300 text-sm space-y-2 list-disc list-inside">
                  <li>Your changes are saved as a pending edit</li>
                  <li>Admin team reviews your changes</li>
                  <li>You'll be notified when approved or if changes are needed</li>
                  <li>Approved changes are sent to all platforms</li>
                  <li>Original release remains live during review</li>
                </ul>
              </div>

              <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
                <p className="text-purple-300 text-sm font-medium mb-2">💡 Pro Tip</p>
                <p className="text-gray-300 text-sm">
                  Make sure all information is accurate before submitting. Multiple edit requests may delay the review process.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowWarningDialog(false)}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSave}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Submit for Review
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
