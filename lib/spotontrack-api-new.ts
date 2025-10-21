/**
 * SpotonTrack API Client
 * Official SpotOnTrack API implementation based on v1 API documentation
 * Provides real music industry statistics, streaming data, and market insights
 */

import { envConfig } from './env-config'

// Official SpotOnTrack API Types based on documentation
export interface SpotOnTrackSearchResult {
  name: string
  release_date: string
  artwork: string
  isrc: string
}

export interface SpotOnTrackTrackMetadata {
  name: string
  release_date: string
  artwork: string
  isrc: string
  artists: Array<{
    id: number
    name: string
    image: string
  }>
  links: {
    spotify: string[]
    apple: string[]
    deezer: string[]
    shazam: string[]
  }
}

export interface SpotOnTrackStreamData {
  date: string
  total: number
  daily: number
}

export interface SpotOnTrackPlaylist {
  position: number
  added_at: string
  playlist: {
    spotify_id?: string
    apple_id?: string
    deezer_id?: string
    name: string
    artwork: string
    followers?: number
  }
}

export interface SpotOnTrackChart {
  country_code: string
  position: number
  previous_position: number | null
  type?: string
  frequency?: string
  genre?: string
  date: string
  streams?: number
  city?: string | null
}

export interface SpotonTrackArtist {
  id: string
  name: string
  image?: string
}

export interface SpotonTrackTrack {
  isrc: string
  name: string
  artist: string
  release_date: string
  artwork: string
  artists: Array<{
    id: number
    name: string
    image: string
  }>
  links: {
    spotify: string[]
    apple: string[]
    deezer: string[]
    shazam: string[]
  }
  // Streaming data from different endpoints
  spotify_streams?: SpotOnTrackStreamData[]
  shazam_data?: Array<{
    date: string
    total: number
    daily: number | null
  }>
  // Playlist data
  spotify_playlists?: SpotOnTrackPlaylist[]
  apple_playlists?: SpotOnTrackPlaylist[]
  deezer_playlists?: SpotOnTrackPlaylist[]
  // Chart data
  spotify_charts?: SpotOnTrackChart[]
  apple_charts?: SpotOnTrackChart[]
  deezer_charts?: SpotOnTrackChart[]
  shazam_charts?: SpotOnTrackChart[]
}

/**
 * Official SpotOnTrack API Client
 */
export class SpotonTrackAPI {
  private baseUrl = 'https://www.spotontrack.com/api/v1'
  private apiKey: string

  constructor() {
    this.apiKey = envConfig.spotontrackApiKey || process.env.SPOTONTRACK_API_KEY || ''
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
    console.log('🎯 SpotonTrack API request:', endpoint, params);
    
    if (!this.hasRealApiKey()) {
      throw new Error('SpotOnTrack API key not configured or invalid. Please set SPOTONTRACK_API_KEY environment variable with a real API key from https://www.spotontrack.com/');
    }
    
    try {
      // Properly construct the URL by removing leading slash from endpoint
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      const url = new URL(cleanEndpoint, this.baseUrl + '/');
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined) {
          url.searchParams.append(key, params[key]);
        }
      });

      console.log('🎯 Making real API call to:', url.toString());

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🎯 Real API response received');
        return data;
      } else {
        const errorText = await response.text();
        console.error('🎯 API error:', response.status, response.statusText, errorText);
        throw new Error(`SpotOnTrack API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error('🎯 API request failed:', error);
      throw error;
    }
  }

  /**
   * Search for tracks using official SpotOnTrack API
   * GET https://www.spotontrack.com/api/v1/tracks?query=XXXX
   */
  async searchTracks(query: string): Promise<SpotOnTrackSearchResult[]> {
    console.log(`🎯 SpotOnTrack: Searching tracks for: ${query}`);
    
    try {
      const response = await this.makeRequest('/tracks', { query });
      
      if (!response || !Array.isArray(response)) {
        console.log('No tracks found for query:', query);
        return [];
      }

      console.log(`✅ Found ${response.length} tracks`);
      return response;
    } catch (error) {
      console.error('SpotonTrack track search error:', error);
      throw new Error(`Failed to search tracks: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get track metadata using official SpotOnTrack API
   * GET https://www.spotontrack.com/api/v1/tracks/{isrc}
   */
  async getTrackMetadata(isrc: string): Promise<SpotOnTrackTrackMetadata | null> {
    console.log(`🎯 SpotOnTrack: Getting metadata for ISRC: ${isrc}`);
    
    try {
      const response = await this.makeRequest(`/tracks/${isrc}`);
      
      if (!response) {
        console.log('No metadata found for ISRC:', isrc);
        return null;
      }

      console.log(`✅ Retrieved metadata for: ${response.name}`);
      return response;
    } catch (error) {
      console.error('SpotonTrack metadata error:', error);
      return null;
    }
  }

  /**
   * Get Spotify streaming data for a track
   * GET https://www.spotontrack.com/api/v1/tracks/{isrc}/spotify/streams
   */
  async getSpotifyStreams(isrc: string): Promise<SpotOnTrackStreamData[]> {
    console.log(`🎯 SpotOnTrack: Getting Spotify streams for: ${isrc}`);
    
    try {
      const response = await this.makeRequest(`/tracks/${isrc}/spotify/streams`);
      return response || [];
    } catch (error) {
      console.error('SpotonTrack Spotify streams error:', error);
      return [];
    }
  }

  /**
   * Get current Spotify playlists for a track
   * GET https://www.spotontrack.com/api/v1/tracks/{isrc}/spotify/playlists/current
   */
  async getSpotifyPlaylists(isrc: string): Promise<SpotOnTrackPlaylist[]> {
    console.log(`🎯 SpotOnTrack: Getting Spotify playlists for: ${isrc}`);
    
    try {
      const response = await this.makeRequest(`/tracks/${isrc}/spotify/playlists/current`);
      return response || [];
    } catch (error) {
      console.error('SpotonTrack Spotify playlists error:', error);
      return [];
    }
  }

  /**
   * Get current Spotify charts for a track
   * GET https://www.spotontrack.com/api/v1/tracks/{isrc}/spotify/charts/current
   */
  async getSpotifyCharts(isrc: string): Promise<SpotOnTrackChart[]> {
    console.log(`🎯 SpotOnTrack: Getting Spotify charts for: ${isrc}`);
    
    try {
      const response = await this.makeRequest(`/tracks/${isrc}/spotify/charts/current`);
      return response || [];
    } catch (error) {
      console.error('SpotonTrack Spotify charts error:', error);
      return [];
    }
  }

  /**
   * Get Apple Music playlists for a track
   * GET https://www.spotontrack.com/api/v1/tracks/{isrc}/apple/playlists/current
   */
  async getApplePlaylists(isrc: string): Promise<SpotOnTrackPlaylist[]> {
    console.log(`🎯 SpotOnTrack: Getting Apple playlists for: ${isrc}`);
    
    try {
      const response = await this.makeRequest(`/tracks/${isrc}/apple/playlists/current`);
      return response || [];
    } catch (error) {
      console.error('SpotonTrack Apple playlists error:', error);
      return [];
    }
  }

  /**
   * Get Shazam data for a track
   * GET https://www.spotontrack.com/api/v1/tracks/{isrc}/shazam/shazams
   */
  async getShazamData(isrc: string): Promise<Array<{date: string, total: number, daily: number | null}>> {
    console.log(`🎯 SpotOnTrack: Getting Shazam data for: ${isrc}`);
    
    try {
      const response = await this.makeRequest(`/tracks/${isrc}/shazam/shazams`);
      return response || [];
    } catch (error) {
      console.error('SpotonTrack Shazam data error:', error);
      return [];
    }
  }

  /**
   * Get comprehensive track analytics by combining multiple endpoints
   */
  async getTrackAnalytics(isrc: string): Promise<SpotonTrackTrack | null> {
    console.log(`🎯 SpotOnTrack: Getting comprehensive analytics for: ${isrc}`);
    
    try {
      // Get basic metadata first
      const metadata = await this.getTrackMetadata(isrc);
      if (!metadata) {
        return null;
      }

      // Get additional data in parallel
      const [
        spotifyStreams,
        spotifyPlaylists,
        spotifyCharts,
        applePlaylists,
        shazamData
      ] = await Promise.all([
        this.getSpotifyStreams(isrc),
        this.getSpotifyPlaylists(isrc),
        this.getSpotifyCharts(isrc),
        this.getApplePlaylists(isrc),
        this.getShazamData(isrc)
      ]);

      // Combine all data
      const trackAnalytics: SpotonTrackTrack = {
        isrc: metadata.isrc,
        name: metadata.name,
        artist: metadata.artists?.[0]?.name || 'Unknown',
        release_date: metadata.release_date,
        artwork: metadata.artwork,
        artists: metadata.artists,
        links: metadata.links,
        spotify_streams: spotifyStreams,
        spotify_playlists: spotifyPlaylists,
        spotify_charts: spotifyCharts,
        apple_playlists: applePlaylists,
        shazam_data: shazamData
      };

      console.log(`✅ Comprehensive analytics compiled for: ${metadata.name}`);
      return trackAnalytics;
    } catch (error) {
      console.error('SpotonTrack analytics error:', error);
      return null;
    }
  }

  /**
   * Legacy method for backward compatibility - maps to track search
   */
  async searchArtist(query: string, limit: number = 10): Promise<SpotonTrackArtist[]> {
    console.log(`🎯 SpotOnTrack: Legacy artist search for: ${query}`);
    
    try {
      const tracks = await this.searchTracks(query);
      
      // Extract unique artists from track results
      const artistMap = new Map<number, SpotonTrackArtist>();
      
      for (const track of tracks.slice(0, limit)) {
        const metadata = await this.getTrackMetadata(track.isrc);
        if (metadata?.artists) {
          for (const artist of metadata.artists) {
            if (!artistMap.has(artist.id)) {
              artistMap.set(artist.id, {
                id: artist.id.toString(),
                name: artist.name,
                image: artist.image
              });
            }
          }
        }
      }

      const artists = Array.from(artistMap.values());
      console.log(`✅ Found ${artists.length} unique artists`);
      return artists;
    } catch (error) {
      console.error('SpotonTrack artist search error:', error);
      throw new Error(`Failed to search artists: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Legacy method for backward compatibility - maps to track search by title
   */
  async searchTrack(title: string, artist?: string): Promise<SpotonTrackTrack | null> {
    console.log(`🎯 SpotOnTrack: Searching track: ${title}${artist ? ` by ${artist}` : ''}`);
    
    try {
      const query = artist ? `${title} ${artist}` : title;
      const tracks = await this.searchTracks(query);
      
      if (tracks.length === 0) {
        return null;
      }

      // Get detailed analytics for the first matching track
      const track = tracks[0];
      return await this.getTrackAnalytics(track.isrc);
    } catch (error) {
      console.error('SpotonTrack track search error:', error);
      return null;
    }
  }

  /**
   * Get track details by ISRC - alias for getTrackAnalytics
   */
  async getTrackDetails(isrc: string): Promise<SpotonTrackTrack | null> {
    return await this.getTrackAnalytics(isrc);
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string, authenticated: boolean }> {
    console.log('🎯 SpotOnTrack: Performing health check');
    
    if (!this.hasRealApiKey()) {
      return { status: 'error', authenticated: false };
    }

    try {
      // Test with a simple track search
      await this.searchTracks('test');
      return { status: 'ok', authenticated: true };
    } catch (error) {
      console.error('SpotOnTrack health check failed:', error);
      return { status: 'error', authenticated: false };
    }
  }
}

// Export singleton instance
export const spotontrackApi = new SpotonTrackAPI()
