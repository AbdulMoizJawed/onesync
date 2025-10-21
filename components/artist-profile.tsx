"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  User, 
  Edit, 
  Music, 
  Star, 
  MapPin, 
  Globe, 
  Instagram, 
  Twitter, 
  Youtube,
  TrendingUp
} from "lucide-react"

interface ArtistProfile {
  id?: string
  user_id: string
  stage_name?: string
  bio?: string
  genres: string[]
  location?: string
  website_url?: string
  spotify_url?: string
  instagram_url?: string
  twitter_url?: string
  youtube_url?: string
  verified: boolean
  follower_count: number
  monthly_listeners: number
  total_streams: number
  profiles?: {
    username: string
    full_name: string
    avatar_url: string
    email: string
  }
}

export default function ArtistProfileComponent() {
  const { user } = useAuth()
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchArtistProfile = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/artists/profile?userId=${user.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setArtistProfile(data)
      }
    } catch (error) {
      console.error('Error fetching artist profile:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchArtistProfile()
    }
  }, [fetchArtistProfile])

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  if (loading) {
    return (
      <Card className="card-dark">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-32"></div>
                <div className="h-3 bg-gray-700 rounded w-24"></div>
              </div>
            </div>
            <div className="h-3 bg-gray-700 rounded w-full"></div>
            <div className="h-3 bg-gray-700 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-dark">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={artistProfile?.profiles?.avatar_url || undefined} />
            <AvatarFallback>
              {artistProfile?.stage_name?.[0] || artistProfile?.profiles?.username?.[0] || 'A'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-white">
                {artistProfile?.stage_name || artistProfile?.profiles?.full_name || 'Your Artist Name'}
              </h2>
              {artistProfile?.verified && (
                <Badge className="bg-blue-500/20 text-blue-400">
                  <Star className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-gray-400">
              @{artistProfile?.profiles?.username || 'username'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {artistProfile?.bio && (
          <p className="text-gray-300">{artistProfile.bio}</p>
        )}
        
        {artistProfile?.location && (
          <div className="flex items-center text-gray-400">
            <MapPin className="w-4 h-4 mr-2" />
            {artistProfile.location}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {formatNumber(artistProfile?.follower_count || 0)}
            </div>
            <div className="text-sm text-gray-400">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {formatNumber(artistProfile?.monthly_listeners || 0)}
            </div>
            <div className="text-sm text-gray-400">Monthly Listeners</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {formatNumber(artistProfile?.total_streams || 0)}
            </div>
            <div className="text-sm text-gray-400">Total Streams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              <TrendingUp className="w-6 h-6 mx-auto mb-1" />
            </div>
            <div className="text-sm text-gray-400">Growth</div>
          </div>
        </div>

        {/* Social Links */}
        {(artistProfile?.website_url || artistProfile?.spotify_url || artistProfile?.instagram_url || artistProfile?.twitter_url || artistProfile?.youtube_url) && (
          <div className="flex flex-wrap gap-2 pt-4">
            {artistProfile.website_url && (
              <a href={artistProfile.website_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Globe className="w-4 h-4 mr-2" />
                  Website
                </Button>
              </a>
            )}
            {artistProfile.spotify_url && (
              <a href={artistProfile.spotify_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Music className="w-4 h-4 mr-2" />
                  Spotify
                </Button>
              </a>
            )}
            {artistProfile.instagram_url && (
              <a href={artistProfile.instagram_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Instagram className="w-4 h-4 mr-2" />
                  Instagram
                </Button>
              </a>
            )}
            {artistProfile.twitter_url && (
              <a href={artistProfile.twitter_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
              </a>
            )}
            {artistProfile.youtube_url && (
              <a href={artistProfile.youtube_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Youtube className="w-4 h-4 mr-2" />
                  YouTube
                </Button>
              </a>
            )}
          </div>
        )}

        {/* Genres */}
        {artistProfile?.genres && artistProfile.genres.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {artistProfile.genres.map((genre, index) => (
              <Badge key={index} variant="secondary" className="bg-gray-800 text-gray-300">
                {genre}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
