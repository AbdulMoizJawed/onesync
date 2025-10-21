/**
 * SpotOnTrack API Client - SIMPLIFIED
 * Just search tracks - that's it!
 */

import { envConfig } from './env-config'

export interface SpotOnTrackTrack {
  isrc: string
  name: string
  release_date: string
  artwork: string
  artists: Array<{
    id: number
    name: string
    image: string
  }>
}

export interface SpotOnTrackArtistData {
  id: string  // Component expects string not number
  name: string
  image: string
  spotify?: {
    id: string
    followers: number
  }
  marketData?: {
    popularity: number
  }
  followers?: {
    total: number
    spotify: number
    instagram: number
    twitter: number
    facebook: number
    youtube: number
  }
  streams?: number
  playlists?: any[]
  chartPerformance?: any
  demographics?: any
}

export interface SpotOnTrackArtist {
  id: number
  name: string
  image: string
  spotify?: {
    id: string
    followers: number
  }
  marketData?: {
    popularity: number
  }
  followers?: {
    total: number
    spotify: number
    instagram: number
    twitter: number
    facebook: number
    youtube: number
  }
  streams?: number
  playlists?: any[]
  chartPerformance?: any
  demographics?: any
}

export interface SpotOnTrackSearchResult {
  tracks: SpotOnTrackTrack[]
  artists: SpotOnTrackArtist[]
}

export class SpotonTrackAPI {
  private baseUrl = 'https://www.spotontrack.com/api/v1'
  private apiKey: string

  constructor() {
    this.apiKey = process.env.SPOTONTRACK_API_KEY || envConfig.spotontrackApiKey || ''
    console.log(`🎯 SpotOnTrack API initialized with key: ${this.apiKey ? (this.apiKey.substring(0, 8) + '...' + this.apiKey.substring(this.apiKey.length - 5)) : 'NOT SET'}`)
  }

  /**
   * Check if we have a real API key configured
   */
  hasRealApiKey(): boolean {
    return !!(this.apiKey && 
              this.apiKey !== 'dev_fallback_key' && 
              this.apiKey !== 'your_spotontrack_api_key_here' &&
              this.apiKey.length > 10)
  }

  /**
   * Make HTTP request to SpotOnTrack API
   */
  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.hasRealApiKey()) {
      throw new Error(`SpotOnTrack API key not configured`);
    }
    
    try {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      const url = new URL(cleanEndpoint, this.baseUrl + '/');
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined) {
          url.searchParams.append(key, params[key]);
        }
      });

      console.log('🎯 Making SpotOnTrack API call to:', url.toString());

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SpotOnTrack API response received');
        return data;
      } else {
        const errorText = await response.text();
        console.error('❌ SpotOnTrack API error:', response.status, response.statusText, errorText);
        throw new Error(`SpotOnTrack API error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ SpotOnTrack API request failed:', error);
      throw error;
    }
  }

  /**
   * Search for tracks - the ONLY method we need!
   */
  async searchTracks(query: string): Promise<SpotOnTrackTrack[]> {
    console.log(`🔍 Searching SpotOnTrack for: "${query}"`);
    
    try {
      const response = await this.makeRequest('/tracks', { query });
      
      if (!response || !Array.isArray(response)) {
        return [];
      }

      console.log(`✅ Found ${response.length} tracks`);
      return response;
    } catch (error) {
      console.error('SpotOnTrack search error:', error);
      return []; // Return empty array instead of throwing to be more user-friendly
    }
  }

  /**
   * Search for a single track
   */
  async searchTrack(trackTitle: string, artistName?: string): Promise<SpotOnTrackTrack[]> {
    const query = artistName ? `${trackTitle} ${artistName}` : trackTitle;
    return this.searchTracks(query);
  }

  /**
   * Search for artists
   */
  async searchArtist(query: string, limit: number = 10): Promise<SpotOnTrackArtist[]> {
    console.log(`🔍 Searching SpotOnTrack artists for: "${query}"`);
    
    try {
      const response = await this.makeRequest('/artists', { query, limit });
      
      if (!response || !Array.isArray(response)) {
        return [];
      }

      console.log(`✅ Found ${response.length} artists`);
      return response;
    } catch (error) {
      console.error('SpotOnTrack artist search error:', error);
      return [];
    }
  }

  /**
   * Get track details by ID
   */
  async getTrackDetails(trackId: string): Promise<SpotOnTrackTrack | null> {
    try {
      const response = await this.makeRequest(`/tracks/${trackId}`);
      return response || null;
    } catch (error) {
      console.error('SpotOnTrack track details error:', error);
      return null;
    }
  }

  /**
   * Get artist details by ID
   */
  async getArtistDetails(artistId: string): Promise<SpotOnTrackArtist | null> {
    try {
      const response = await this.makeRequest(`/artists/${artistId}`);
      return response || null;
    } catch (error) {
      console.error('SpotOnTrack artist details error:', error);
      return null;
    }
  }

  /**
   * Get track analytics
   */
  async getTrackAnalytics(trackId: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/tracks/${trackId}/analytics`);
      return response || {};
    } catch (error) {
      console.error('SpotOnTrack track analytics error:', error);
      return {};
    }
  }

  /**
   * Get Spotify streams for a track
   */
  async getSpotifyStreams(trackId: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/tracks/${trackId}/spotify/streams`);
      return response || {};
    } catch (error) {
      console.error('SpotOnTrack Spotify streams error:', error);
      return {};
    }
  }

  /**
   * Get Spotify playlists for a track
   */
  async getSpotifyPlaylists(trackId: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/tracks/${trackId}/spotify/playlists`);
      return response || [];
    } catch (error) {
      console.error('SpotOnTrack Spotify playlists error:', error);
      return [];
    }
  }

  /**
   * Get Spotify charts for a track
   */
  async getSpotifyCharts(trackId: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/tracks/${trackId}/spotify/charts`);
      return response || [];
    } catch (error) {
      console.error('SpotOnTrack Spotify charts error:', error);
      return [];
    }
  }

  /**
   * Get Apple playlists for a track
   */
  async getApplePlaylists(trackId: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/tracks/${trackId}/apple/playlists`);
      return response || [];
    } catch (error) {
      console.error('SpotOnTrack Apple playlists error:', error);
      return [];
    }
  }

  /**
   * Get Apple charts for a track
   */
  async getAppleCharts(trackId: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/tracks/${trackId}/apple/charts`);
      return response || [];
    } catch (error) {
      console.error('SpotOnTrack Apple charts error:', error);
      return [];
    }
  }

  /**
   * Get Deezer playlists for a track
   */
  async getDeezerPlaylists(trackId: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/tracks/${trackId}/deezer/playlists`);
      return response || [];
    } catch (error) {
      console.error('SpotOnTrack Deezer playlists error:', error);
      return [];
    }
  }

  /**
   * Get Shazam data for a track
   */
  async getShazamData(trackId: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/tracks/${trackId}/shazam`);
      return response || {};
    } catch (error) {
      console.error('SpotOnTrack Shazam data error:', error);
      return {};
    }
  }

  /**
   * Verify API key
   */
  async verifyApiKey(): Promise<boolean> {
    try {
      await this.makeRequest('/verify');
      return true;
    } catch (error) {
      console.error('SpotOnTrack API key verification error:', error);
      return false;
    }
  }

  /**
   * Health check method
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log('🎯 SpotOnTrack: Performing health check')
      const result = await this.searchTracks('test')
      console.log('✅ Found', result.length, 'tracks')
      return true
    } catch (error) {
      console.error('❌ SpotOnTrack health check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const spotontrackApi = new SpotonTrackAPI()
