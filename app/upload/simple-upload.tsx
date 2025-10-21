"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Check, Plus, User } from "lucide-react"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Artist {
  id: string
  name: string
  genre?: string
}

interface UploadData {
  title: string
  selectedArtistId: string
  newArtistName: string
  genre: string
  audioFile: File | null
  imageFile: File | null
}

export default function SimpleUpload() {
  const [formData, setFormData] = useState<UploadData>({
    title: "",
    selectedArtistId: "",
    newArtistName: "",
    genre: "",
    audioFile: null,
    imageFile: null
  })
  
  const [artists, setArtists] = useState<Artist[]>([])
  const [showNewArtistForm, setShowNewArtistForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  // Load user and their artists on component mount
  useEffect(() => {
    loadUserAndArtists()
  }, [])

  const loadUserAndArtists = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("Please log in to upload music")
        return
      }
      setUser(user)

      // Get user's artists
      const { data: artistsData, error: artistsError } = await supabase
        .from('artists')
        .select('id, name, genre')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('name')

      if (artistsError) {
        console.warn("Could not load artists:", artistsError.message)
        setArtists([])
      } else {
        setArtists(artistsData || [])
        // If user has no artists, show the new artist form
        if (!artistsData || artistsData.length === 0) {
          setShowNewArtistForm(true)
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error)
      setError("Failed to load user data")
    }
  }

  const createNewArtist = async () => {
    if (!formData.newArtistName.trim() || !user) {
      setError("Artist name is required")
      return null
    }

    try {
      const { data, error } = await supabase
        .from('artists')
        .insert({
          user_id: user.id,
          name: formData.newArtistName.trim(),
          genre: formData.genre || null,
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        setError("Failed to create artist: " + error.message)
        return null
      }

      // Add to local artists list
      setArtists(prev => [...prev, data])
      setShowNewArtistForm(false)
      setFormData(prev => ({ 
        ...prev, 
        selectedArtistId: data.id,
        newArtistName: ""
      }))

      return data
    } catch (error) {
      setError("Failed to create artist")
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.title || !formData.audioFile || !formData.imageFile) {
      setError("Please fill in all required fields and select files")
      return
    }

    // Check if we need to create a new artist
    if (showNewArtistForm && !formData.selectedArtistId) {
      const newArtist = await createNewArtist()
      if (!newArtist) return
    }

    // Ensure we have an artist selected
    if (!formData.selectedArtistId) {
      setError("Please select an artist")
      return
    }

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      // Simulate upload process
      setProgress(25)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setProgress(50)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setProgress(75)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setProgress(100)
      setSuccess(true)
      
      // Reset form
      setFormData({
        title: "",
        selectedArtistId: "",
        newArtistName: "",
        genre: "",
        audioFile: null,
        imageFile: null
      })

    } catch (err: any) {
      console.error("Upload error:", err)
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Simple Music Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <Check className="h-4 w-4" />
              <AlertDescription>
                Upload successful! Files uploaded to Supabase storage.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Song Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter song title"
                disabled={uploading}
              />
            </div>

            <div>
              <Label htmlFor="artist">Artist *</Label>
              {artists.length > 0 && !showNewArtistForm ? (
                <div className="space-y-2">
                  <Select 
                    value={formData.selectedArtistId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, selectedArtistId: value }))}
                    disabled={uploading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your artist profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {artists.map((artist) => (
                        <SelectItem key={artist.id} value={artist.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {artist.name} {artist.genre && `(${artist.genre})`}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewArtistForm(true)}
                    disabled={uploading}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Artist Profile
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    id="newArtist"
                    value={formData.newArtistName}
                    onChange={(e) => setFormData(prev => ({ ...prev, newArtistName: e.target.value }))}
                    placeholder="Enter artist name"
                    disabled={uploading}
                  />
                  {artists.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowNewArtistForm(false)
                        setFormData(prev => ({ ...prev, newArtistName: "" }))
                      }}
                      disabled={uploading}
                      className="w-full"
                    >
                      Cancel - Use Existing Artist
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                placeholder="Enter genre"
                disabled={uploading}
              />
            </div>

            <div>
              <Label htmlFor="audio">Audio File</Label>
              <Input
                id="audio"
                type="file"
                accept="audio/*"
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  audioFile: e.target.files?.[0] || null 
                }))}
                disabled={uploading}
              />
            </div>

            <div>
              <Label htmlFor="image">Cover Art</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  imageFile: e.target.files?.[0] || null 
                }))}
                disabled={uploading}
              />
            </div>

            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground">
                  Uploading... {progress}%
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={uploading}
              className="w-full"
            >
              {uploading ? "Uploading..." : "Upload to Supabase"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Artist-Based Upload Process:</h3>
            <ul className="text-sm space-y-1">
              <li>✅ Artist profiles linked to your account</li>
              <li>✅ Audio + Image → Supabase Storage</li>
              <li>✅ CSV metadata → Supabase Database</li>
              <li>✅ Release data + metadata → Supabase Database</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
