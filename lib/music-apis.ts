/**
 * Music Platform API Integration
 * Search for artists on Spotify and Apple Music
 */

import { envConfig, hasValidSpotifyConfig } from './env-config'

// Types
export interface ArtistSearchResult {
  name: string
  spotifyUrl?: string
  appleMusicUrl?: string
  image?: string
  followers?: number
  genres?: string[]
}

export interface SpotifyArtist {
  id: string
  name: string
  external_urls: { spotify: string }
  followers: { total: number }
  genres: string[]
  images: Array<{ url: string; height: number; width: number }>
  popularity: number
}

export interface AppleMusicArtist {
  id: string
  type: string
  attributes: {
    name: string
    url: string
    genreNames: string[]
    artwork?: {
      url: string
      width: number
      height: number
    }
  }
}

class MusicAPIClient {
  private spotifyAccessToken: string | null = null
  private appleMusicToken: string | null = null

  // Initialize with API tokens
  constructor() {
    // Apple Music integration removed - Spotify only
  }

  /**
   * Get Spotify access token using Client Credentials flow with automatic fallback
   */
  async getSpotifyAccessToken(): Promise<string> {
    if (this.spotifyAccessToken) {
      return this.spotifyAccessToken
    }

    // First, try the configured credentials
    let clientId = envConfig.spotifyClientId
    let clientSecret = envConfig.spotifyClientSecret
    let usingFallback = false

    if (!clientId || !clientSecret) {
      throw new Error('Spotify API credentials not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.')
    }

    const tryAuthentication = async (id: string, secret: string): Promise<{ token: string | null, error?: string }> => {
      try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${id}:${secret}`)}`
          },
          body: 'grant_type=client_credentials'
        })

        if (!response.ok) {
          const errorText = await response.text()
          return { token: null, error: `${response.status}: ${errorText}` }
        }

        const data = await response.json()
        const token: string = data.access_token
        
        if (!token) {
          return { token: null, error: 'No access token received from Spotify' }
        }

        return { token }
      } catch (error) {
        return { token: null, error: error instanceof Error ? error.message : String(error) }
      }
    }

    // Try primary credentials first
    let result = await tryAuthentication(clientId, clientSecret)
    
    // If primary credentials fail, try fallback credentials
    if (!result.token) {
      console.warn('🎵 Primary Spotify credentials failed, trying fallback credentials...')
      console.warn('Primary error:', result.error)
      
      // Use fallback credentials from env-config
      const fallbackClientId = '474879af111c44ec8f835be52ac8ef01'
      const fallbackClientSecret = '43bf4784ce07415293d751f451b5e21a'
      
      result = await tryAuthentication(fallbackClientId, fallbackClientSecret)
      
      if (result.token) {
        usingFallback = true
        console.log('✅ Spotify API authenticated using fallback credentials')
      } else {
        console.error('❌ Both primary and fallback Spotify credentials failed')
        console.error('Fallback error:', result.error)
        throw new Error(`All Spotify credentials failed. Primary: ${result.error}`)
      }
    } else {
      console.log('✅ Spotify API authenticated using primary credentials')
    }

    if (!result.token) {
      throw new Error('Failed to authenticate with Spotify API using any available credentials')
    }

    this.spotifyAccessToken = result.token
    
    // Token expires in 1 hour, so we'll reset it after 55 minutes
    setTimeout(() => {
      this.spotifyAccessToken = null
    }, 55 * 60 * 1000)

    if (usingFallback) {
      console.warn('🔧 Using fallback Spotify credentials - consider updating SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET for production')
    }

    return result.token
  }

  /**
   * Get artist by Spotify ID
   */
  async getSpotifyArtist(artistId: string): Promise<SpotifyArtist | null> {
    try {
      const accessToken = await this.getSpotifyAccessToken()
      
      const response = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`)
      }

      const artist = await response.json()
      return artist
    } catch (error) {
      console.error('Error fetching Spotify artist:', error)
      return null
    }
  }

  /**
   * Search for artist on Spotify
   */
  async searchSpotifyArtist(artistName: string): Promise<SpotifyArtist | null> {
    try {
      const accessToken = await this.getSpotifyAccessToken()
      
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Spotify search error:', response.status, errorText)
        throw new Error(`Spotify API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      if (data.artists && data.artists.items && data.artists.items.length > 0) {
        return data.artists.items[0] as SpotifyArtist
      }

      return null
    } catch (error) {
      console.error('Error searching Spotify artist:', error)
      if (envConfig.isDevelopment) {
        console.warn('🔧 Artist search not working in development - check Spotify API configuration')
      }
      return null
    }
  }

  /**
   * Search for artist on Apple Music - DISABLED
   */
  async searchAppleMusicArtist(artistName: string, storefront: string = 'us'): Promise<AppleMusicArtist | null> {
    // Apple Music integration removed
    return null
  }

  /**
   * Search Spotify for artist and return results
   */
  async searchArtist(artistName: string): Promise<ArtistSearchResult | null> {
    try {
      // Search only Spotify
      const spotifyArtist = await this.searchSpotifyArtist(artistName)

      // If we found results on Spotify
      if (spotifyArtist) {
        const result: ArtistSearchResult = {
          name: spotifyArtist.name,
          spotifyUrl: spotifyArtist.external_urls.spotify,
          appleMusicUrl: undefined, // No Apple Music integration
          image: spotifyArtist.images[0]?.url,
          followers: spotifyArtist.followers.total,
          genres: spotifyArtist.genres || []
        }

        return result
      }

      return null
    } catch (error) {
      console.error('Error searching artist:', error)
      return null
    }
  }
}

// Export singleton instance
export const musicAPIClient = new MusicAPIClient()
