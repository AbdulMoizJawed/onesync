/**
 * BeatStars API Integration
 * Handles beat marketplace functionality including search, uploads, payments, and user management
 */

export interface BeatStarsUser {
  id: string
  username: string
  displayName: string
  avatar: string
  verified: boolean
  followers: number
  following: number
  totalBeats: number
  totalSales: number
  joinDate: string
  location?: string
  bio?: string
  socialLinks?: {
    instagram?: string
    twitter?: string
    youtube?: string
    soundcloud?: string
  }
}

export interface Beat {
  id: string
  title: string
  producer: BeatStarsUser
  price: {
    basic: number
    premium: number
    unlimited: number
    exclusive?: number
  }
  duration: number
  bpm: number
  key: string
  genre: string
  mood: string[]
  tags: string[]
  audioUrl: string
  waveformUrl?: string
  artworkUrl: string
  uploadDate: string
  plays: number
  likes: number
  downloads: number
  isExclusive: boolean
  isFeatured: boolean
  description?: string
  stems?: {
    available: boolean
    price?: number
  }
}

export interface BeatUpload {
  title: string
  genre: string
  mood: string[]
  tags: string[]
  bpm: number
  key: string
  audioFile: File
  artworkFile?: File
  price: {
    basic: number
    premium: number
    unlimited: number
    exclusive?: number
  }
  description?: string
  stemsAvailable?: boolean
  stemsPrice?: number
}

export interface BeatStarsSearchParams {
  query?: string
  genre?: string
  mood?: string
  bpm?: {
    min: number
    max: number
  }
  key?: string
  priceRange?: {
    min: number
    max: number
  }
  sortBy?: 'newest' | 'popular' | 'trending' | 'price_low' | 'price_high'
  limit?: number
  offset?: number
}

export interface BeatStarsConfig {
  apiKey?: string
  clientId?: string
  clientSecret?: string
  baseUrl?: string
}

export class BeatStarsAPI {
  private config: BeatStarsConfig
  private baseUrl = 'https://api.beatstars.com/v1'

  constructor(config: BeatStarsConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.BEATSTARS_API_KEY,
      clientId: config.clientId || process.env.BEATSTARS_CLIENT_ID,
      clientSecret: config.clientSecret || process.env.BEATSTARS_CLIENT_SECRET,
      baseUrl: config.baseUrl || this.baseUrl
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    console.log(`🎵 BeatStars API: ${options.method || 'GET'} ${endpoint}`)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        console.error(`🎵 BeatStars API error: ${response.status} ${response.statusText}`)
        throw new Error(`BeatStars API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`🎵 BeatStars API: Success for ${endpoint}`)
      return data
    } catch (error) {
      console.error('🎵 BeatStars API request failed:', error)
      throw error
    }
  }

  /**
   * Search for beats
   */
  async searchBeats(params: BeatStarsSearchParams): Promise<{ beats: Beat[]; total: number }> {
    const searchParams = new URLSearchParams()
    
    if (params.query) searchParams.append('q', params.query)
    if (params.genre) searchParams.append('genre', params.genre)
    if (params.mood) searchParams.append('mood', params.mood)
    if (params.bpm?.min) searchParams.append('bpm_min', params.bpm.min.toString())
    if (params.bpm?.max) searchParams.append('bpm_max', params.bpm.max.toString())
    if (params.key) searchParams.append('key', params.key)
    if (params.priceRange?.min) searchParams.append('price_min', params.priceRange.min.toString())
    if (params.priceRange?.max) searchParams.append('price_max', params.priceRange.max.toString())
    if (params.sortBy) searchParams.append('sort', params.sortBy)
    searchParams.append('limit', (params.limit || 20).toString())
    searchParams.append('offset', (params.offset || 0).toString())

    return this.makeRequest(`/beats/search?${searchParams.toString()}`)
  }

  /**
   * Get featured beats
   */
  async getFeaturedBeats(limit = 20): Promise<Beat[]> {
    const data = await this.makeRequest<{ beats: Beat[] }>(`/beats/featured?limit=${limit}`)
    return data.beats || []
  }

  /**
   * Get trending beats
   */
  async getTrendingBeats(limit = 20): Promise<Beat[]> {
    const data = await this.makeRequest<{ beats: Beat[] }>(`/beats/trending?limit=${limit}`)
    return data.beats || []
  }

  /**
   * Get beat details
   */
  async getBeat(beatId: string): Promise<Beat> {
    return this.makeRequest(`/beats/${beatId}`)
  }

  /**
   * Get user profile
   */
  async getUser(userId: string): Promise<BeatStarsUser> {
    return this.makeRequest(`/users/${userId}`)
  }

  /**
   * Get user's beats
   */
  async getUserBeats(userId: string, limit = 20, offset = 0): Promise<Beat[]> {
    const data = await this.makeRequest<{ beats: Beat[] }>(`/users/${userId}/beats?limit=${limit}&offset=${offset}`)
    return data.beats || []
  }

  /**
   * Upload a beat
   */
  async uploadBeat(beatData: BeatUpload, userId: string): Promise<Beat> {
    const formData = new FormData()
    formData.append('title', beatData.title)
    formData.append('genre', beatData.genre)
    formData.append('mood', JSON.stringify(beatData.mood))
    formData.append('tags', JSON.stringify(beatData.tags))
    formData.append('bpm', beatData.bpm.toString())
    formData.append('key', beatData.key)
    formData.append('price', JSON.stringify(beatData.price))
    formData.append('audio', beatData.audioFile)
    
    if (beatData.artworkFile) {
      formData.append('artwork', beatData.artworkFile)
    }
    
    if (beatData.description) {
      formData.append('description', beatData.description)
    }

    return this.makeRequest(`/users/${userId}/beats`, {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set multipart headers
    })
  }

  /**
   * Purchase a beat
   */
  async purchaseBeat(beatId: string, licenseType: 'basic' | 'premium' | 'unlimited' | 'exclusive', paymentMethod: string): Promise<{ success: boolean; downloadUrl?: string; transactionId?: string }> {
    return this.makeRequest(`/beats/${beatId}/purchase`, {
      method: 'POST',
      body: JSON.stringify({
        license_type: licenseType,
        payment_method: paymentMethod
      })
    })
  }

  /**
   * Get user's purchases
   */
  async getUserPurchases(userId: string): Promise<{ beat: Beat; licenseType: string; purchaseDate: string; downloadUrl: string }[]> {
    const data = await this.makeRequest<{ purchases: any[] }>(`/users/${userId}/purchases`)
    return data.purchases || []
  }

  /**
   * Like/unlike a beat
   */
  async toggleLike(beatId: string, userId: string): Promise<{ liked: boolean }> {
    return this.makeRequest(`/beats/${beatId}/like`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    })
  }

  /**
   * Get genres list
   */
  async getGenres(): Promise<string[]> {
    const data = await this.makeRequest<{ genres: string[] }>('/genres')
    return data.genres || []
  }

  /**
   * Get moods list
   */
  async getMoods(): Promise<string[]> {
    const data = await this.makeRequest<{ moods: string[] }>('/moods')
    return data.moods || []
  }

}

export default BeatStarsAPI
