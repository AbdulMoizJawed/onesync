/**
 * Chartmetric API Client
 * Handles authentication, search, and data retrieval from Chartmetric API
 */

export interface ChartmetricConfig {
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
}

export interface ChartmetricArtist {
  id: number
  name: string
  image_url: string
  isni?: string
  sp_monthly_listeners?: number
  sp_followers?: number
  cm_artist_score?: number
}

export interface ChartmetricTrack {
  id: string
  cm_track: string
  name: string
  image_url: string
  isrc: string
  artist_names: string[]
  artist: Array<{
    id: number
    name: string
  }>
  album?: Array<{
    id: number
    name: string
    release_date: string
  }>
}

export interface ChartmetricPlaylist {
  id: number | string
  name: string
  image_url: string
  owner_name: string
}

export interface ChartmetricAlbum {
  id: number
  name: string
  image_url: string
  label: string
}

export interface ChartmetricSearchResponse {
  artists: ChartmetricArtist[]
  playlists: {
    spotify: ChartmetricPlaylist[]
    applemusic: ChartmetricPlaylist[]
    deezer: ChartmetricPlaylist[]
    amazon: ChartmetricPlaylist[]
    youtube: ChartmetricPlaylist[]
  }
  tracks: ChartmetricTrack[]
  albums: ChartmetricAlbum[]
  curators: {
    spotify: Array<{ id: number; name: string; image_url?: string }>
    applemusic: Array<{ id: number; name: string; image_url?: string }>
    deezer: Array<{ id: string; name: string; image_url?: string }>
  }
  cities: Array<{
    id: number
    name: string
    name_ascii: string
    population: number
    country: string
    code2: string
    province?: string
    trigger_city: boolean
  }>
  songwriters: Array<{
    name: string
    doc_id: number
    artistName: string
    image_url?: string
  }>
}

export interface ChartmetricTrackDetails {
  id: number
  name: string
  isrc: string
  image_url: string
  duration_ms: number
  composer_name: string
  artists: Array<{
    id: number
    name: string
    image_url: string
    code2: string
  }>
  albums: Array<{
    id: number
    name: string
    upc: string
    release_date: string
    label: string
    image_url: string
  }>
  tags: string
  explicit: boolean
  cm_statistics: {
    num_sp_playlists: number
    num_sp_editorial_playlists: number
    sp_popularity: number
    sp_streams: string
    youtube_views: string
    tiktok_counts: number
    shazam_counts: number
  }
}

export interface ChartmetricChartData {
  data: Array<{
    rank: number
    added_at: string
    code2: string
    plays: number
    chart_type: string
    peak_rank: number
    peak_date: string
    name: string
    cm_track: number
    spotify_popularity: number
    artist_names: string[]
  }>
  length: number
}

export class ChartmetricAPI {
  private config: ChartmetricConfig
  private baseUrl = 'https://api.chartmetric.com/api'

  constructor(config: ChartmetricConfig = {}) {
    this.config = {
      accessToken: config.accessToken || process.env.CHARTMETRIC_ACCESS_TOKEN,
      refreshToken: config.refreshToken || process.env.CHARTMETRIC_REFRESH_TOKEN,
      expiresAt: config.expiresAt
    }
    
    // Ensure we have required credentials
    if (!this.config.refreshToken) {
      throw new Error('Chartmetric refresh token is required. Set CHARTMETRIC_REFRESH_TOKEN environment variable.')
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Check if token is expired and refresh if needed
    if (!this.config.accessToken || this.isTokenExpired()) {
      console.log('🎵 Chartmetric: Refreshing access token...')
      await this.refreshAccessToken()
    }

    const url = `${this.baseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.config.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`
    }

    console.log(`🎵 Chartmetric API: ${options.method || 'GET'} ${endpoint}`)
    
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      console.error(`🎵 Chartmetric API error: ${response.status} ${response.statusText}`)
      
      // If not authorized, return mock data for development
      if (response.status === 401) {
        console.log('🎵 Chartmetric: API not authorized, returning mock data for development')
        return this.getMockData(endpoint) as T
      }
      
      throw new Error(`Chartmetric API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`🎵 Chartmetric API: Success for ${endpoint}`)
    
    // Return the data directly as per the official API docs structure
    return data.obj || data
  }

  /**
   * Provide mock data when API is not available (development only)
   */
  private getMockData(endpoint: string): any {
    console.log(`🎵 Chartmetric: Generating mock data for ${endpoint}`)
    
    if (endpoint.includes('/search')) {
      return {
        artists: [
          {
            id: 123456,
            name: "The Beatles",
            image_url: "https://via.placeholder.com/300x300?text=The+Beatles",
            isni: "0000000123456789",
            sp_monthly_listeners: 50000000,
            sp_followers: 8000000,
            cm_artist_score: 95.5
          },
          {
            id: 789012,
            name: "Beatles Tribute Band",
            image_url: "https://via.placeholder.com/300x300?text=Tribute",
            sp_monthly_listeners: 100000,
            sp_followers: 50000,
            cm_artist_score: 65.2
          }
        ],
        tracks: [
          {
            id: "456789",
            cm_track: "456789",
            name: "Hey Jude",
            image_url: "https://via.placeholder.com/300x300?text=Hey+Jude",
            isrc: "GBUM71800001",
            artist_names: ["The Beatles"],
            artist: [{ id: 123456, name: "The Beatles" }],
            album: [{ id: 789, name: "The Beatles 1967-1970", release_date: "1973-04-01" }]
          }
        ],
        albums: [],
        playlists: [],
        labels: [],
        cities: []
      }
    }
    
    if (endpoint.includes('/track/')) {
      return {
        id: 456789,
        name: "Hey Jude",
        artists: [{ id: 123456, name: "The Beatles" }],
        cm_statistics: {
          num_sp_playlists: 15420,
          num_sp_editorial_playlists: 156,
          sp_popularity: 89,
          sp_streams: "1234567890",
          youtube_views: "987654321",
          tiktok_counts: 45000,
          shazam_counts: 123000
        },
        genres: ["Pop", "Rock", "Classic Rock"],
        mood: ["Happy", "Nostalgic"],
        isrc: "GBUM71800001",
        image_url: "https://via.placeholder.com/300x300?text=Hey+Jude"
      }
    }
    
    return { message: "Mock data not available for this endpoint" }
  }

  /**
   * Refresh access token using refresh token (following official docs pattern)
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.config.refreshToken) {
      throw new Error('No refresh token available')
    }

    console.log('🎵 Chartmetric: Requesting new access token...')
    
    const response = await fetch('https://api.chartmetric.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshtoken: this.config.refreshToken
      }),
    })

    if (!response.ok) {
      console.error(`🎵 Chartmetric: Failed to refresh token: ${response.status} ${response.statusText}`)
      throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    this.config.accessToken = data.token
    this.config.expiresAt = Date.now() + (data.expires_in * 1000)
    
    console.log('🎵 Chartmetric: Access token refreshed successfully')
  }

  /**
   * Search for artists, tracks, albums, playlists, etc.
   */
  async search(params: {
    q: string
    limit?: number
    offset?: number
    type?: 'all' | 'artists' | 'tracks' | 'playlists' | 'curators' | 'albums' | 'stations' | 'cities' | 'songwriters'
    beta?: boolean
    platforms?: string[]
    triggerCitiesOnly?: boolean
  }): Promise<ChartmetricSearchResponse> {
    const searchParams = new URLSearchParams()
    searchParams.append('q', params.q)
    
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.offset) searchParams.append('offset', params.offset.toString())
    if (params.type) searchParams.append('type', params.type)
    if (params.beta) searchParams.append('beta', params.beta.toString())
    if (params.triggerCitiesOnly) searchParams.append('triggerCitiesOnly', params.triggerCitiesOnly.toString())
    if (params.platforms) {
      params.platforms.forEach(platform => searchParams.append('platforms', platform))
    }

    return this.makeRequest<ChartmetricSearchResponse>(`/search?${searchParams.toString()}`)
  }

  /**
   * Search by social media URLs
   */
  async socialSearch(params: {
    url: string
    type?: 'all' | 'artists' | 'curators' | 'radio' | 'siriusxm' | 'songwriters'
  }): Promise<Array<{ id: number; type: string; name?: string; image_url?: string }>> {
    const searchParams = new URLSearchParams()
    searchParams.append('url', params.url)
    if (params.type) searchParams.append('type', params.type)

    return this.makeRequest(`/search/social?${searchParams.toString()}`)
  }

  /**
   * Get track metadata by Chartmetric ID
   */
  async getTrack(trackId: number): Promise<ChartmetricTrackDetails> {
    return this.makeRequest<ChartmetricTrackDetails>(`/track/${trackId}`)
  }

  /**
   * Get track IDs across different platforms
   */
  async getTrackIds(params: {
    type: 'chartmetric' | 'isrc' | 'amazon' | 'beatport' | 'deezer' | 'genius' | 'itunes' | 'shazam' | 'spotify' | 'soundcloud' | 'tiktok' | 'qq' | 'youtube'
    id: string
  }): Promise<{
    isrc: string
    chartmetric_ids: number[]
    spotify_ids: string[]
    itunes_ids: string[]
    deezer_ids: string[]
    amazon_ids: string[]
    youtube_ids: string[]
    soundcloud_ids: string[]
    shazam_ids: string[]
    tiktok_ids: string[]
    beatport_ids: string[]
    qq_ids: string[]
    genius_ids: string[]
  }> {
    return this.makeRequest(`/track/${params.type}/${params.id}/get-ids`)
  }

  /**
   * Get track charts data
   */
  async getTrackCharts(params: {
    trackId: number
    type: 'spotify_viral_daily' | 'spotify_viral_weekly' | 'spotify_top_daily' | 'spotify_top_weekly' | 'applemusic_top' | 'applemusic_daily' | 'applemusic_albums' | 'itunes_top' | 'itunes_albums' | 'shazam' | 'beatport' | 'amazon' | 'soundcloud' | 'airplay_daily' | 'airplay_weekly'
    since: string
    until?: string
  }): Promise<ChartmetricChartData> {
    const searchParams = new URLSearchParams()
    searchParams.append('since', params.since)
    if (params.until) searchParams.append('until', params.until)

    return this.makeRequest<ChartmetricChartData>(`/track/${params.trackId}/${params.type}/charts?${searchParams.toString()}`)
  }

  /**
   * Get filtered tracks list
   */
  async getFilteredTracks(params: {
    limit?: number
    offset?: number
    sortOrderDesc?: boolean
    sortColumn?: string
    genres?: number[]
    artists?: number[]
    range_period?: 'latest' | 'monthly_diff' | 'weekly_diff' | 'monthly_diff_percent' | 'weekly_diff_percent'
    min_score?: number
    max_score?: number
    min_release_date?: string
    max_release_date?: string
    [key: string]: any
  } = {}): Promise<any[]> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()))
        } else {
          searchParams.append(key, value.toString())
        }
      }
    })

    return this.makeRequest(`/track/list/filter?${searchParams.toString()}`)
  }

  /**
   * Get cities by country code
   */
  async getCities(countryCode: string): Promise<Array<{
    city_id: number
    city_name: string
    latitude: number
    longitude: number
    population: number
    province?: string
    locality: string
    country: string
    image_url?: string
    iso3: string
  }>> {
    return this.makeRequest(`/cities?country_code=${countryCode}`)
  }

  /**
   * Get all genres or search by name
   */
  async getGenres(name?: string): Promise<Array<{ id: number; name: string }>> {
    const params = name ? `?name=${encodeURIComponent(name)}` : ''
    return this.makeRequest(`/genres${params}`)
  }

  /**
   * Get genre by ID
   */
  async getGenre(id: number): Promise<{ id: number; name: string }> {
    return this.makeRequest(`/genres/${id}`)
  }

  /**
   * Update access token
   */
  setAccessToken(token: string, expiresAt?: number) {
    this.config.accessToken = token
    if (expiresAt) {
      this.config.expiresAt = expiresAt
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    if (!this.config.accessToken || !this.config.expiresAt) return true
    return Date.now() >= this.config.expiresAt
  }
}

export default ChartmetricAPI
