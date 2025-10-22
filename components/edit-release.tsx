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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import CustomLoader from "@/components/ui/custom-loader"
import { animations } from "@/lib/animations"
import { ArrowLeft, Save, Upload, Music, AlertTriangle, X, Plus } from "lucide-react"
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

// Expanded sub-genres list
const SUB_GENRES: Record<string, string[]> = {
  "Pop": ["Synth Pop", "Teen Pop", "Dance Pop", "Indie Pop", "Art Pop"],
  "Rock": ["Hard Rock", "Indie Rock", "Alternative Rock", "Progressive Rock", "Punk Rock"],
  "Electronic": ["House", "Techno", "Trance", "Dubstep", "Drum & Bass", "EDM"],
  "Hip-Hop": ["Trap", "Boom Bap", "Conscious Hip-Hop", "Gangsta Rap", "Cloud Rap"],
  "Jazz": ["Smooth Jazz", "Bebop", "Free Jazz", "Fusion", "Latin Jazz"],
  "Classical": ["Baroque", "Romantic", "Modern Classical", "Chamber Music", "Opera"],
  "Country": ["Country Pop", "Outlaw Country", "Bluegrass", "Country Rock"],
  "R&B": ["Contemporary R&B", "Neo Soul", "Alternative R&B"],
  "Metal": ["Heavy Metal", "Death Metal", "Black Metal", "Thrash Metal", "Power Metal"],
  "Folk": ["Indie Folk", "Contemporary Folk", "Traditional Folk", "Folk Rock"],
  "Latin": ["Reggaeton", "Salsa", "Bachata", "Latin Pop", "Regional Mexican"],
  "Dance": ["House", "Techno", "Trance", "EDM", "Breakbeat"],
  "Blues": ["Delta Blues", "Chicago Blues", "Electric Blues"],
  "Reggae": ["Roots Reggae", "Dancehall", "Dub"],
  "Soul": ["Neo Soul", "Northern Soul", "Southern Soul"],
  "World": ["Afrobeat", "K-Pop", "Bollywood", "Celtic"],
  "Alternative": ["Indie", "Grunge", "Post-Punk", "Dream Pop"],
  "Punk": ["Pop Punk", "Hardcore Punk", "Post-Hardcore"]
}

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

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "ru", name: "Russian" }
]

const RELEASE_TYPES = [
  { value: "single", label: "Single" },
  { value: "ep", label: "EP" },
  { value: "album", label: "Album" }
]

const PRICE_TIERS = [
  { value: "0.99", label: "$0.99" },
  { value: "1.29", label: "$1.29" },
  { value: "1.99", label: "$1.99" },
  { value: "custom", label: "Custom Price" }
]

export function EditRelease({ releaseId, onCancel, onUpdate }: EditReleaseProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [release, setRelease] = useState<Release | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")

  // Form state - matching Upload component structure
  const [formData, setFormData] = useState({
    // Basic fields
    title: "",
    artist_name: "",
    featured_artist: "",
    display_artist: "",
    genre: "",
    sub_genre: "",
    release_date: "",
    release_type: "single",
    language: "en",

    // Metadata fields
    upc: "",
    cat_number: "",
    artwork_name: "",
    publisher: "",
    record_label: "",
    lyricist: "",
    composer: "",

    // Copyright fields
    p_line: "",
    c_line: "",
    copyright_year: new Date().getFullYear(),

    // Content fields
    description: "",
    lyrics: "",

    // Pricing fields
    price_tier: "0.99",
    custom_price: 0,

    // Tags
    tags: [] as string[]
  })

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [newCoverArt, setNewCoverArt] = useState<File | null>(null)
  const [newCoverArtPreview, setNewCoverArtPreview] = useState<string | null>(null)
  const [selectedFeaturedArtists, setSelectedFeaturedArtists] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [showWarningDialog, setShowWarningDialog] = useState(false)

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

        // Populate all form fields from the release data
        setFormData({
          title: data.title || "",
          artist_name: data.artist_name || "",
          featured_artist: data.featured_artist || "",
          display_artist: data.display_artist || "",
          genre: data.genre || "",
          sub_genre: data.sub_genre || "",
          release_date: data.release_date || "",
          release_type: data.release_type || "single",
          language: data.language || "en",
          upc: data.upc || "",
          cat_number: data.cat_number || "",
          artwork_name: data.artwork_name || "",
          publisher: data.publisher || "",
          record_label: data.record_label || "",
          lyricist: data.lyricist || "",
          composer: data.composer || "",
          p_line: data.p_line || "",
          c_line: data.c_line || "",
          copyright_year: data.copyright_year || new Date().getFullYear(),
          description: data.description || "",
          lyrics: data.lyrics || "",
          price_tier: data.price_tier || "0.99",
          custom_price: data.custom_price || 0,
          tags: data.tags || []
        })

        setSelectedPlatforms(data.platforms || [])

        // Parse featured artists if they exist
        if (data.featured_artist) {
          setSelectedFeaturedArtists(data.featured_artist.split(' & '))
        }
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

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      })
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const handleRemoveFeaturedArtist = (artistToRemove: string) => {
    const updatedArtists = selectedFeaturedArtists.filter(artist => artist !== artistToRemove)
    setSelectedFeaturedArtists(updatedArtists)
    setFormData({
      ...formData,
      featured_artist: updatedArtists.join(' & ')
    })
  }

  const validateForm = () => {
    // Required fields validation
    if (!formData.title.trim()) {
      toast.error("Title is required")
      return false
    }

    if (!formData.artist_name.trim()) {
      toast.error("Artist name is required")
      return false
    }

    if (!formData.genre) {
      toast.error("Genre is required")
      return false
    }

    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform")
      return false
    }

    return true
  }

  const handleSaveClick = () => {
    if (!validateForm()) {
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

      // Create edit request with all fields
      const { data: editRequest, error } = await supabase
        .from("release_edit_requests")
        .insert({
          release_id: release.id,
          user_id: user.id,
          title: formData.title,
          artist_name: formData.artist_name,
          featured_artist: formData.featured_artist || null,
          display_artist: formData.display_artist || null,
          genre: formData.genre,
          sub_genre: formData.sub_genre || null,
          release_date: formData.release_date || null,
          release_type: formData.release_type,
          language: formData.language,
          description: formData.description || null,
          lyrics: formData.lyrics || null,
          upc: formData.upc || null,
          cat_number: formData.cat_number || null,
          artwork_name: formData.artwork_name || null,
          publisher: formData.publisher || null,
          record_label: formData.record_label || null,
          lyricist: formData.lyricist || null,
          composer: formData.composer || null,
          p_line: formData.p_line || null,
          c_line: formData.c_line || null,
          copyright_year: formData.copyright_year,
          price_tier: formData.price_tier,
          custom_price: formData.custom_price,
          tags: formData.tags,
          platforms: selectedPlatforms,
          cover_art_url: coverArtUrl,
          status: "pending",
          admin_notes: null
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating edit request:", error)
        throw new Error("Failed to submit edit request")
      }

      toast.success("Edit request submitted successfully! Pending admin review.")

      // Update the release in the parent component
      const updatedRelease = {
        ...release,
        ...formData,
        platforms: selectedPlatforms,
        cover_art_url: coverArtUrl
      }

      onUpdate(updatedRelease)
    } catch (error) {
      console.error("Error submitting edit:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit edit request")
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <CustomLoader animation={animations.orbit} />
      </div>
    )
  }

  if (!release) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <p className="text-gray-400">Release not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Releases
          </Button>
          <div className="flex gap-3">
            <Button
              onClick={handleSaveClick}
              disabled={saving || uploading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {saving ? (
                <>
                  <CustomLoader animation={animations.spin} />
                  <span className="ml-2">Saving...</span>
                </>
              ) : uploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-pulse" />
                  Uploading...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Submit for Review
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tabs for organizing fields */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="glass border-gray-800 mb-6">
            <TabsTrigger value="basic" className="data-[state=active]:bg-purple-600">
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="metadata" className="data-[state=active]:bg-purple-600">
              Metadata
            </TabsTrigger>
            <TabsTrigger value="copyright" className="data-[state=active]:bg-purple-600">
              Copyright
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-purple-600">
              Content
            </TabsTrigger>
            <TabsTrigger value="distribution" className="data-[state=active]:bg-purple-600">
              Distribution
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cover Art */}
              <Card className="card-dark lg:col-span-1">
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

              {/* Basic Information */}
              <Card className="card-dark lg:col-span-2">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-white text-lg sm:text-xl">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
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

                    <div className="space-y-2">
                      <Label className="text-white text-sm">Display Artist</Label>
                      <Input
                        value={formData.display_artist}
                        onChange={(e) => setFormData({ ...formData, display_artist: e.target.value })}
                        className="input-dark"
                        placeholder="How the artist appears (optional)"
                      />
                      <p className="text-xs text-gray-500">Leave empty to use Artist Name</p>
                    </div>
                  </div>

                  {/* Featured Artists */}
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Featured Artists</Label>
                    {selectedFeaturedArtists.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedFeaturedArtists.map((artist) => (
                          <Badge
                            key={artist}
                            variant="secondary"
                            className="bg-gray-800 text-gray-200 hover:bg-gray-700"
                          >
                            {artist}
                            <button
                              onClick={() => handleRemoveFeaturedArtist(artist)}
                              className="ml-2 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Input
                      value={formData.featured_artist}
                      onChange={(e) => setFormData({ ...formData, featured_artist: e.target.value })}
                      className="input-dark"
                      placeholder="Enter featured artist names (separated by ' & ')"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2   w-full">
                      <Label className="text-white text-sm">Genre *</Label>
                      <Select
                        value={formData.genre}
                        onValueChange={(value) => setFormData({ ...formData, genre: value, sub_genre: "" })}
                      >
                        <SelectTrigger className="input-dark  w-full">
                          <SelectValue placeholder="Select genre" />
                        </SelectTrigger>
                        <SelectContent className="glass border-gray-800 max-h-40 overflow-y-auto w-full  ">
                          {GENRES.map((genre) => (
                            <SelectItem key={genre} value={genre} className="text-gray-200 text-sm">
                              {genre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

<div className="space-y-2 w-full">
  <Label className="text-white text-sm">Sub-Genre</Label>
  <Select
    value={formData.sub_genre}
    onValueChange={(value) => setFormData({ ...formData, sub_genre: value })}
    disabled={!formData.genre}
  >
    <SelectTrigger className="input-dark w-full">
      <SelectValue placeholder="Select sub-genre" />
    </SelectTrigger>
    <SelectContent className="glass border-gray-800 max-h-40 overflow-y-auto w-full">
      {formData.genre &&
        SUB_GENRES[formData.genre]?.map((subGenre) => (
          <SelectItem
            key={subGenre}
            value={subGenre}
            className="text-gray-200 text-sm"
          >
            {subGenre}
          </SelectItem>
        ))}
    </SelectContent>
  </Select>
</div>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 w-full">
                      <Label className="text-white text-sm">Release Type</Label>
                      <Select
                        value={formData.release_type}
                        onValueChange={(value) => setFormData({ ...formData, release_type: value })}
                      >
                        <SelectTrigger className="input-dark w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass border-gray-800 w-full">
                          {RELEASE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="text-gray-200">
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 w-full">
                      <Label className="text-white text-sm">Language</Label>
                      <Select
                        value={formData.language}
                        onValueChange={(value) => setFormData({ ...formData, language: value })}
                      >
                        <SelectTrigger className="input-dark w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass border-gray-800 max-h-40 overflow-y-auto w-full">
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code} className="text-gray-200">
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 ">
                    <Label className="text-white text-sm">Release Date</Label>
                    <Input
                      type="date"
                      value={formData.release_date}
                      onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                      className="input-dark"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Metadata Tab */}
          <TabsContent value="metadata" className="space-y-6">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-white">Metadata & Identifiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white text-sm">UPC/Barcode</Label>
                    <Input
                      value={formData.upc}
                      onChange={(e) => setFormData({ ...formData, upc: e.target.value })}
                      className="input-dark"
                      placeholder="Leave blank to auto-generate"
                    />
                    <p className="text-xs text-gray-500">Universal Product Code</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm">Catalog Number</Label>
                    <Input
                      value={formData.cat_number}
                      onChange={(e) => setFormData({ ...formData, cat_number: e.target.value })}
                      className="input-dark"
                      placeholder="e.g., CAT-001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm">Artwork Name</Label>
                    <Input
                      value={formData.artwork_name}
                      onChange={(e) => setFormData({ ...formData, artwork_name: e.target.value })}
                      className="input-dark"
                      placeholder="Name/title of the artwork"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm">Publisher</Label>
                    <Input
                      value={formData.publisher}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                      className="input-dark"
                      placeholder="Publishing company name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm">Record Label</Label>
                    <Input
                      value={formData.record_label}
                      onChange={(e) => setFormData({ ...formData, record_label: e.target.value })}
                      className="input-dark"
                      placeholder="Your record label"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm">Lyricist</Label>
                    <Input
                      value={formData.lyricist}
                      onChange={(e) => setFormData({ ...formData, lyricist: e.target.value })}
                      className="input-dark"
                      placeholder="Who wrote the lyrics"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm">Composer</Label>
                    <Input
                      value={formData.composer}
                      onChange={(e) => setFormData({ ...formData, composer: e.target.value })}
                      className="input-dark"
                      placeholder="Who composed the music"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Copyright Tab */}
          <TabsContent value="copyright" className="space-y-6">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-white">Copyright Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Copyright Year</Label>
                    <Input
                      type="number"
                      value={formData.copyright_year}
                      onChange={(e) => setFormData({ ...formData, copyright_year: parseInt(e.target.value) || new Date().getFullYear() })}
                      className="input-dark"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm">P-Line</Label>
                    <Input
                      value={formData.p_line}
                      onChange={(e) => setFormData({ ...formData, p_line: e.target.value })}
                      className="input-dark"
                      placeholder="℗ 2025 Artist Name"
                    />
                    <p className="text-xs text-gray-500">Phonographic copyright (sound recording)</p>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-white text-sm">C-Line</Label>
                    <Input
                      value={formData.c_line}
                      onChange={(e) => setFormData({ ...formData, c_line: e.target.value })}
                      className="input-dark"
                      placeholder="© 2025 Artist Name"
                    />
                    <p className="text-xs text-gray-500">Copyright notice (composition/lyrics)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-white">Content & Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white text-sm">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-dark"
                    placeholder="Describe your release..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white text-sm">Lyrics</Label>
                  <Textarea
                    value={formData.lyrics}
                    onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                    className="input-dark"
                    placeholder="Enter song lyrics (optional)"
                    rows={6}
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label className="text-white text-sm">Tags</Label>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-gray-800 text-gray-200 hover:bg-gray-700"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                      className="input-dark flex-1"
                      placeholder="Add a tag..."
                    />
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      className="bg-gray-700 hover:bg-gray-600"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Distribution Tab */}
          <TabsContent value="distribution" className="space-y-6">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-white">Distribution Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Platforms */}
                <div className="space-y-4">
                  <Label className="text-white text-sm">Distribution Platforms *</Label>
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

                {/* Pricing */}
                <div className="space-y-4">
                  <Label className="text-white text-sm">Price Tier</Label>
                  <Select
                    value={formData.price_tier}
                    onValueChange={(value) => setFormData({ ...formData, price_tier: value })}
                  >
                    <SelectTrigger className="input-dark">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border-gray-800 w-full">
                      {PRICE_TIERS.map((tier) => (
                        <SelectItem key={tier.value} value={tier.value} className="text-gray-200">
                          {tier.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {formData.price_tier === "custom" && (
                    <div className="space-y-2">
                      <Label className="text-white text-sm">Custom Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.custom_price}
                        onChange={(e) => setFormData({ ...formData, custom_price: parseFloat(e.target.value) || 0 })}
                        className="input-dark"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button - Always Visible */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSaveClick}
            disabled={saving || uploading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            size="lg"
          >
            {saving ? (
              <>
                <CustomLoader animation={animations.spin} />
                <span className="ml-2">Saving...</span>
              </>
            ) : uploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-pulse" />
                Uploading...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Submit for Review
              </>
            )}
          </Button>
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
                  Once approved, your updated release will be resubmitted to all selected distribution platforms. This process typically takes 24-72 hours.
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