/**
 * Combined Music APIs Service
 * Integrates Spotify and SpotonTrack APIs for enriched music data
 */

import { spotontrackApi } from './spotontrack-api'
import { envConfig } from './env-config'

export interface EnrichedArtistData {
  // Basic Spotify data
  spotify?: {
    id: string
    name: string
    images: Array<{ url: string; height: number; width: number }>
    genres: string[]
    followers: { total: number }
    popularity: number
    external_urls: { spotify: string }
  }
  
  // SpotonTrack industry stats
  spotontrack?: {
    streams: number
    monthlyListeners: number
    chartPositions: any[]
    marketData: any
  }
  
  // Combined/computed data
  combined: {
    name: string
    imageUrl?: string
    popularityScore: number
    genres: string[]
    socialLinks: {
      spotify?: string
      website?: string
      facebook?: string
      instagram?: string
      twitter?: string
    }
    // SpotonTrack streaming data
    streams?: {
      total: number
      monthly: number
      daily: number
    }
    followers?: {
      spotify: number
      instagram: number
      twitter: number
      facebook: number
      youtube: number
      total: number
    }
    playlists?: {
      total: number
      editorial: number
      userGenerated: number
      spotifyPlaylists: Array<{
        name: string
        followers: number
        url: string
      }>
    }
    chartPerformance?: {
      peakPosition: number
      currentPosition: number
      weeksOnChart: number
      countries: string[]
    }
    marketData?: {
      popularity: number
      trend: 'rising' | 'stable' | 'declining'
      trendPercentage: number
      industry_rank: number
    }
  }
}

export interface EnrichedTrackData {
  spotify?: any
  spotontrack?: any
  combined: {
    title: string
    artists: string[]
    duration: number
    popularity: number
    releaseDate: string
    audioFeatures?: any
  }
}

export interface EnrichedAlbumData {
  spotify?: any
  spotontrack?: any
  combined: {
    title: string
    artists: string[]
    releaseDate: string
    trackCount: number
    imageUrl?: string
  }
}

class CombinedMusicAPIService {
  private spotifyToken: string | null = null
  
  // Get Spotify access token
  private async getSpotifyToken(): Promise<string> {
    if (this.spotifyToken) return this.spotifyToken
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${envConfig.spotifyClientId}:${envConfig.spotifyClientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    })
    
    const data = await response.json()
    this.spotifyToken = data.access_token
    
    // Refresh token before it expires
    setTimeout(() => {
      this.spotifyToken = null
    }, (data.expires_in - 60) * 1000)
    
    return this.spotifyToken || ''
  }
  
  // Search Spotify
  private async searchSpotify(query: string, type: 'artist' | 'track' | 'album'): Promise<any> {
    try {
      const token = await this.getSpotifyToken()
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) return null
      
      const data = await response.json()
      return data[`${type}s`]?.items[0] || null
    } catch (error) {
      console.error('Spotify search error:', error)
      return null
    }
  }
  
  // Get Spotify audio features for a track
  private async getSpotifyAudioFeatures(trackId: string): Promise<any> {
    try {
      const token = await this.getSpotifyToken()
      const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        console.log(`Audio features request failed: ${response.status}`)
        return null
      }
      
      return await response.json()
    } catch (error) {
      console.error('Spotify audio features error:', error)
      return null
    }
  }
  
  // Search SpotonTrack using real API
  private async searchSpotonTrack(query: string, type: string): Promise<any> {
    try {
      const { spotontrackApi } = await import('./spotontrack-api')
      
      // Use searchTracks for both artist and track searches
      const results = await spotontrackApi.searchTracks(query)
      return results && results.length > 0 ? results[0] : null
    } catch (error) {
      console.error('SpotonTrack search error:', error)
      return null
    }
  }
  
  // Get enriched artist data combining all APIs
  async getEnrichedArtistData(artistName: string): Promise<EnrichedArtistData> {
    const [spotifyResult, spotontrackResult] = await Promise.allSettled([
      this.searchSpotify(artistName, 'artist'),
      this.searchSpotonTrack(artistName, 'artist')
    ])
    
    const spotify = spotifyResult.status === 'fulfilled' ? spotifyResult.value : null
    const spotontrack = spotontrackResult.status === 'fulfilled' ? spotontrackResult.value : null
    
    // Combine data with priority on real Spotify data
    const combined = {
      name: spotify?.name || spotontrack?.name || artistName,
      imageUrl: spotify?.images?.[0]?.url || spotontrack?.image,
      popularityScore: spotify?.popularity || 0, // Real Spotify popularity only
      genres: spotify?.genres || [],
      socialLinks: {
        spotify: spotify?.external_urls?.spotify,
      },
      // Real Spotify follower data
      followers: {
        spotify: spotify?.followers?.total || 0,
        instagram: 0, // Not available from Spotify
        twitter: 0,   // Not available from Spotify
        facebook: 0,  // Not available from Spotify
        youtube: 0,   // Not available from Spotify
        total: spotify?.followers?.total || 0
      }
    }
    
    return {
      spotify,
      spotontrack,
      combined
    }
  }
  
  // Get enriched track data
  async getEnrichedTrackData(trackTitle: string, artistName?: string, trackId?: string): Promise<EnrichedTrackData> {
    const searchQuery = artistName ? `${trackTitle} artist:${artistName}` : trackTitle
    
    const [spotifyResult, spotontrackResult] = await Promise.allSettled([
      this.searchSpotify(searchQuery, 'track'),
      (async () => {
        // Use searchTracks as fallback since getTrackDetails doesn't exist
        const results = await spotontrackApi.searchTracks(searchQuery)
        return results && results.length > 0 ? results[0] : null
      })()
    ])
    
    const spotify = spotifyResult.status === 'fulfilled' ? spotifyResult.value : null
    const spotontrack = spotontrackResult.status === 'fulfilled' ? spotontrackResult.value : null
    
    // Get real Spotify audio features if we have a track ID
    let spotifyAudioFeatures = null
    if (spotify?.id) {
      try {
        spotifyAudioFeatures = await this.getSpotifyAudioFeatures(spotify.id)
      } catch (error) {
        console.log('Could not get Spotify audio features:', error)
      }
    }
    
    // Chart history not available in simplified API - skipping
    // if (spotontrack?.isrc) {
    //   try {
    //     const chartHistory = await spotontrackApi.getTrackChartHistory(spotontrack.isrc);
    //     if (chartHistory && chartHistory.length > 0) {
    //       spotontrack.chartHistory = chartHistory;
    //     }
    //   } catch (error) {
    //     console.log('Could not get SpotonTrack chart history:', error);
    //   }
    // }
    
    const combined = {
      title: spotify?.name || spotontrack?.name || trackTitle,
      artists: spotify?.artists?.map((a: any) => a.name) || spotontrack?.artists?.map((a: any) => a.name) || [artistName || 'Unknown Artist'],
      duration: spotify?.duration_ms || 0,
      popularity: spotify?.popularity || 0,
      releaseDate: spotify?.album?.release_date || spotontrack?.release_date || '',
      audioFeatures: spotifyAudioFeatures || null
    }
    
    return {
      spotify,
      spotontrack,
      combined
    }
  }
  
  // Get enriched album data
  async getEnrichedAlbumData(albumTitle: string, artistName?: string): Promise<EnrichedAlbumData> {
    const searchQuery = artistName ? `${albumTitle} artist:${artistName}` : albumTitle
    
    const [spotifyResult, spotontrackResult] = await Promise.allSettled([
      this.searchSpotify(searchQuery, 'album'),
      this.searchSpotonTrack(searchQuery, 'album')
    ])
    
    const spotify = spotifyResult.status === 'fulfilled' ? spotifyResult.value : null
    const spotontrack = spotontrackResult.status === 'fulfilled' ? spotontrackResult.value : null
    
    const combined = {
      title: spotify?.name || albumTitle,
      artists: spotify?.artists?.map((a: any) => a.name) || [],
      releaseDate: spotify?.release_date || '',
      trackCount: spotify?.total_tracks || 0,
      imageUrl: spotify?.images?.[0]?.url
    }
    
    return {
      spotify,
      spotontrack,
      combined
    }
  }
  
  // Search for multiple artists
  async searchArtists(query: string, limit: number = 5): Promise<any[]> {
    try {
      const token = await this.getSpotifyToken()
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) return []
      
      const data = await response.json()
      return data.artists?.items || []
    } catch (error) {
      console.error('Spotify artists search error:', error)
      return []
    }
  }
  
  // Search for multiple tracks
  async searchTracks(query: string, limit: number = 5): Promise<any[]> {
    try {
      const token = await this.getSpotifyToken()
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) return []
      
      const data = await response.json()
      return data.tracks?.items || []
    } catch (error) {
      console.error('Spotify tracks search error:', error)
      return []
    }
  }
  
  // Get trending data (primarily from SpotonTrack)
  async getTrendingArtists(timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly', limit: number = 20): Promise<any[]> {
    try {
      // Trending artists not available in simplified API
      console.warn('getTrendingArtists not implemented in simplified SpotonTrack API')
      return []
    } catch (error) {
      console.error('Error fetching trending artists:', error)
      return []
    }
  }
}

export const combinedMusicApi = new CombinedMusicAPIService()

// Export commonly used functions
export const searchMusic = combinedMusicApi.searchArtists.bind(combinedMusicApi)
export const searchTracks = combinedMusicApi.searchTracks.bind(combinedMusicApi)
export const searchArtists = combinedMusicApi.searchArtists.bind(combinedMusicApi)
