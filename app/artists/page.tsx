"use client"
// @ts-nocheck

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth, supabase } from "@/lib/auth"
import type { Database, Artist } from "@/lib/supabase"
import type { ArtistSearchResult } from "@/lib/music-apis"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconComponent } from "@/components/ui/icons"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArtistCardSkeleton } from "@/components/loading-skeletons"
import { ExternalLink } from "lucide-react"
import React from "react"
import Image from 'next/image'
import dynamic from "next/dynamic"
import { ArtistImage } from "@/components/optimized-image"

const ArtistSearch = dynamic(() => import("@/components/artist-search").then(mod => ({ default: mod.ArtistSearch })), {
  ssr: false,
  loading: () => <p>Loading...</p>
})

// Using imported `Artist` type from `@/lib/supabase`

type ArtistWithEarnings = Artist & {
  totalEarnings?: number
  pendingPayouts?: number
  activeCollaborations?: number
  spotify?: string
  spotify_url?: string
  [key: string]: any
}

// Memoized Artist Card Component for better performance
const ArtistCard = React.memo(({ 
  artist, 
  index, 
  onEdit, 
  onDelete 
}: {
  artist: ArtistWithEarnings
  index: number
  onEdit: (artist: Artist) => void
  onDelete: (artistId: string) => void
}) => {
  return (
    <Card className={`card-dark animate-dissolve-in hover-lift-gentle stagger-${Math.min(index + 1, 5)} overflow-hidden`}>
      <CardHeader className="flex flex-row items-start justify-between pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="space-y-1.5 flex-1 min-w-0 pr-2">
          <CardTitle className="text-white text-base sm:text-lg truncate">{artist.name}</CardTitle>
          <CardDescription className="text-gray-400 text-xs sm:text-sm truncate">
            {artist.genre || "No genre specified"}
          </CardDescription>
          {artist.location && (
            <CardDescription className="text-gray-500 text-xs truncate">📍 {artist.location}</CardDescription>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0">
              <IconComponent name="moreHorizontal" className="w-4 h-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white animate-slide-in-down">
            <DropdownMenuItem onClick={() => onEdit(artist)} className="hover:bg-gray-700 hover-scale press-effect">
              <IconComponent name="edit" className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(artist.id)}
              className="text-red-400 hover:bg-gray-700 hover:text-red-400 hover-scale press-effect"
            >
              <IconComponent name="delete" className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="aspect-square w-full mb-3 rounded-md overflow-hidden">
          <ArtistImage
            src={artist.image || artist.avatar_url}
            alt={artist.name}
            className="w-full h-full rounded-md"
            size="lg"
          />
        </div>
        
        {(artist.spotify_url || artist.spotify) && (
          <a 
            href={artist.spotify_url || artist.spotify} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-300 text-xs mb-2"
          >
            <ExternalLink className="w-3 h-3" />
            View on Spotify
          </a>
        )}
        
        {artist.bio && <p className="text-gray-400 text-xs sm:text-sm line-clamp-2 mb-3">{artist.bio}</p>}
        
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 truncate">Genre</span>
            <span className="text-gray-300 font-medium text-xs">
              {artist.genre || 'Not specified'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 truncate">Status</span>
            <Badge variant="secondary" className="status-success text-xs px-1.5 py-0.5">
              Active
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export default function ArtistsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [artists, setArtists] = useState<ArtistWithEarnings[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredArtists, setFilteredArtists] = useState<ArtistWithEarnings[]>([])

  // Form state
  const [artistName, setArtistName] = useState("")
  const [artistBio, setArtistBio] = useState("")
  const [artistGenre, setArtistGenre] = useState("")
  const [artistLocation, setArtistLocation] = useState("")
  const [artistImage, setArtistImage] = useState("")
  const [spotifyUrl, setSpotifyUrl] = useState("")
  const [selectedSpotifyArtist, setSelectedSpotifyArtist] = useState<ArtistSearchResult | null>(null)
  const [updatingImages, setUpdatingImages] = useState(false)
  

  // Filter artists based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredArtists(artists)
    } else {
      const filtered = artists.filter(artist => 
        artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (artist.genre && artist.genre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (artist.location && artist.location.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredArtists(filtered)
    }
  }, [artists, searchTerm])

  

  const fetchArtists = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      if (!supabase) return
    
      const { data, error: fetchError } = await supabase
        .from("artists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (fetchError) {
        console.error("Error fetching artists:", fetchError)
        // Handle JSON parse errors gracefully
        const errorMessage = fetchError.message || "Unknown error occurred"
        setError(`Failed to load artists: ${errorMessage}`)
      } else {
        // Fetch all artist data in batch to avoid N+1 queries
        const artistIds = data.map(artist => artist.id)
        
        // For now, we'll just set basic artist data without earnings/collaborations
        // This can be re-enabled later if needed

        // Just use the basic artist data without additional processing
        const enhancedArtists = data.map(artist => ({
          ...artist,
          totalEarnings: 0,
          pendingPayouts: 0,
          activeCollaborations: 0
        }))
        
        setArtists(enhancedArtists)
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred while loading artists")
    } finally {
      setLoading(false)
    }
  }, [user])




  const resetForm = () => {
    setArtistName("")
    setArtistBio("")
    setArtistGenre("")
    setArtistLocation("")
    setArtistImage("")
    setSpotifyUrl("")
    setSelectedSpotifyArtist(null)
    setEditingArtist(null)
  }

  useEffect(() => {
    if (user) {
      fetchArtists()
    }
  }, [fetchArtists, user])

  const handleSaveArtist = async () => {
    if (!user || !artistName.trim()) {
      setError("Artist name is required")
      return
    }

    if (!selectedSpotifyArtist) {
      setError("Please select an artist from Spotify search")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const artistData = {
        user_id: user.id,
        name: artistName.trim(),
        bio: artistBio.trim() || null,
        genre: artistGenre.trim() || null,
        location: artistLocation.trim() || null,
        image: artistImage || null,
        avatar_url: artistImage || null, // Keep both columns in sync
        spotify_url: spotifyUrl || null,
        spotify: spotifyUrl || null, // Keep both columns in sync
      }

      let result
      if (editingArtist) {
        // Update existing artist
        if (!supabase) return
        
        result = await supabase
          .from("artists")
          .update({
            name: artistData.name,
            bio: artistData.bio,
            genre: artistData.genre,
            location: artistData.location,
            image: artistData.image,
            avatar_url: artistData.avatar_url,
            spotify_url: artistData.spotify_url,
            spotify: artistData.spotify,
          })
          .eq("id", editingArtist.id)
          .eq("user_id", user.id) // Extra security check
      } else {
        // Create new artist
        if (!supabase) return
        
        result = await supabase.from("artists").insert(artistData)
      }

      if (result.error) {
        console.error("Error saving artist:", result.error)
        setError(`Failed to save artist: ${result.error.message}`)
      } else {
        setIsDialogOpen(false)
        resetForm()
        await fetchArtists() // Refresh the list
      }
    } catch (err) {
      console.error("Unexpected error saving artist:", err)
      setError("An unexpected error occurred while saving")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteArtist = async (artistId: string) => {
    if (!confirm("Are you sure you want to delete this artist? This cannot be undone.")) return

    try {
      if (!supabase) return
      
      const { error: deleteError } = await supabase.from("artists").delete().eq("id", artistId).eq("user_id", user?.id) // Extra security check

      if (deleteError) {
        console.error("Error deleting artist:", deleteError)
        setError(`Failed to delete artist: ${deleteError.message}`)
      } else {
        await fetchArtists() // Refresh the list
      }
    } catch (err) {
      console.error("Unexpected error deleting artist:", err)
      setError("An unexpected error occurred while deleting")
    }
  }

  const openEditDialog = (artist: Artist) => {
    setEditingArtist(artist)
    setArtistName(artist.name)
    setArtistBio(artist.bio || "")
    setArtistGenre(artist.genre || "")
    setArtistLocation(artist.location || "")
    setError(null)
    setIsDialogOpen(true)
  }

  const openNewDialog = () => {
    resetForm()
    setError(null)
    setIsDialogOpen(true)
  }

  const updateArtistImages = async () => {
    if (!user) return

    setUpdatingImages(true)
    setError(null)

    try {
      const response = await fetch('/api/artists/update-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id })
      })

      const result = await response.json()

      if (response.ok) {
        if (result.updated > 0) {
          setError(null)
          // Show success message
          toast.success(`Successfully updated ${result.updated} artist images from Spotify!`)
          // Refresh the artists list
          await fetchArtists()
        } else {
          toast.info('All your artists already have images!')
        }
      } else {
        setError(`Failed to update images: ${result.error}`)
        toast.error(`Failed to update images: ${result.error}`)
      }
    } catch (err) {
      console.error('Error updating artist images:', err)
      setError('Failed to update artist images')
      toast.error('Failed to update artist images')
    } finally {
      setUpdatingImages(false)
    }
  }



  if (!user) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen bg-gray-950 items-center justify-center">
          <p className="text-white">Loading...</p>
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
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-2 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4 px-2 sm:px-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Artists</h1>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <IconComponent name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search artists..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-gray-500 w-full sm:w-64"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={updateArtistImages} 
                      disabled={updatingImages || loading}
                      variant="outline" 
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 text-sm"
                    >
                      <IconComponent name="image" className="w-4 h-4 mr-2" />
                      {updatingImages ? 'Updating...' : 'Update Images'}
                    </Button>
                    <Button onClick={openNewDialog} className="button-primary w-full sm:w-auto text-sm sm:text-base">
                      <IconComponent name="addCircle" className="w-4 h-4 mr-2" />
                      Add Artist
                    </Button>
                  </div>
                </div>
              </div>

              {error && (
                <Alert className="mb-6 status-error">
                  <IconComponent name="alert" className="h-4 w-4" />
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-6 px-2 sm:px-0">
                  {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      {[...Array(6)].map((_, i) => (
                        <ArtistCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : filteredArtists.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-0">
                  {filteredArtists.map((artist, index) => (
                    <ArtistCard
                      key={artist.id}
                      artist={artist}
                      index={index}
                      onEdit={openEditDialog}
                      onDelete={handleDeleteArtist}
                    />
                  ))}
                </div>
                  ) : searchTerm ? (
                    <div className="text-center py-16 border-2 border-dashed border-gray-800 rounded-lg">
                      <IconComponent name="search" className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h2 className="text-xl font-semibold text-white mb-2">No Artists Found</h2>
                      <p className="text-gray-500 mb-4">No artists match your search &quot;{searchTerm}&quot;.</p>
                      <Button onClick={() => setSearchTerm("")} variant="outline" className="border-gray-600 text-gray-400 hover:bg-gray-800">
                        Clear Search
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-16 border-2 border-dashed border-gray-800 rounded-lg">
                      <IconComponent name="user" className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h2 className="text-xl font-semibold text-white mb-2">No Artists Found</h2>
                      <p className="text-gray-500 mb-4">Get started by adding your first artist profile.</p>
                      <Button onClick={openNewDialog} className="button-primary">
                        Add Your First Artist
                      </Button>
                    </div>
                  )}
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
                <DialogHeader className="sticky top-0 bg-gray-900 pb-4 z-10">
                  <DialogTitle>{editingArtist ? "Edit Artist" : "Add New Artist"}</DialogTitle>
                  <DialogDescription>
                    {editingArtist
                      ? "Update the details for this artist."
                      : "Add a new artist profile to your account."}
                  </DialogDescription>
                </DialogHeader>

                {error && (
                  <Alert className="border-red-500 bg-red-500/10">
                    <IconComponent name="alert" className="h-4 w-4" />
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-gray-400 text-sm">
                      Search & Select Artist from Spotify *
                    </Label>
                    <ArtistSearch
                      placeholder="Type artist name to search Spotify..."
                      onArtistSelect={(artist: ArtistSearchResult) => {
                        setSelectedSpotifyArtist(artist)
                        setArtistName(artist.name)
                        setArtistImage(artist.image || "")
                        setSpotifyUrl(artist.spotifyUrl || "")
                        // Extract genre from artist info if available
                        if (artist.genres && artist.genres.length > 0) {
                          setArtistGenre(artist.genres.join(", "))
                        }
                      }}
                    />
                    {selectedSpotifyArtist && (
                      <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                        {selectedSpotifyArtist.image && (
                          <Image 
                            src={selectedSpotifyArtist.image} 
                            alt={selectedSpotifyArtist.name}
                            className="w-12 h-12 rounded-full object-cover"
                            width={48}
                            height={48}
                          />
                        )}
                        <div>
                          <p className="text-white font-medium">{selectedSpotifyArtist.name}</p>
                          <p className="text-gray-400 text-sm">From Spotify</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-400 text-sm">
                      Name *
                    </Label>
                    <Input
                      id="name"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      className="w-full bg-gray-800 border-gray-600 focus:ring-gray-500"
                      placeholder="e.g. DJ Quantum"
                      required
                      disabled={!!selectedSpotifyArtist}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genre" className="text-gray-400 text-sm">
                      Genre
                    </Label>
                    <Input
                      id="genre"
                      value={artistGenre}
                      onChange={(e) => setArtistGenre(e.target.value)}
                      className="w-full bg-gray-800 border-gray-600 focus:ring-gray-500"
                      placeholder="e.g. Electronic, Hip Hop"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-gray-400 text-sm">
                      Location
                    </Label>
                    <Input
                      id="location"
                      value={artistLocation}
                      onChange={(e) => setArtistLocation(e.target.value)}
                      className="w-full bg-gray-800 border-gray-600 focus:ring-gray-500"
                      placeholder="e.g. Los Angeles, CA"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-gray-400 text-sm">
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      value={artistBio}
                      onChange={(e) => setArtistBio(e.target.value)}
                      className="w-full bg-gray-800 border-gray-600 focus:ring-gray-500 min-h-[80px]"
                      placeholder="Tell us about this artist..."
                    />
                  </div>
                </div>

                <DialogFooter className="sticky bottom-0 bg-gray-900 pt-4 border-t border-gray-700 mt-4">
                  <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)} disabled={saving} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={handleSaveArtist}
                    className="button-primary w-full sm:w-auto"
                    disabled={saving || !artistName.trim() || !selectedSpotifyArtist}
                  >
                    {saving ? "Saving..." : "Save Artist"}
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
