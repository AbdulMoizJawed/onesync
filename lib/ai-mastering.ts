const AI_MASTERING_BASE_URL = 'https://api.bakuage.com'

export interface AudioUploadResponse {
  id: number
  name: string
  status: string
  created_at: string
  updated_at: string
  sample_rate: number
  channels: number
  frames: number
  rms?: number
  peak?: number
  loudness?: number
  dynamics?: number
}

export interface MasteringRequest {
  input_audio_id: number
  mode?: 'default' | 'custom'
  preset?: 'general' | 'pop' | 'jazz' | 'classical'
  target_loudness?: number
  target_loudness_mode?: 'loudness' | 'rms' | 'peak' | 'youtube_loudness'
  mastering?: boolean
  output_format?: 'wav' | 'mp3'
  bit_depth?: 16 | 24 | 32
  sample_rate?: 44100
  bass_preservation?: boolean
  mastering_algorithm?: 'v1' | 'v2'
  mastering_reverb?: boolean
  mastering_reverb_gain?: number
  low_cut_freq?: number
  high_cut_freq?: number
  noise_reduction?: boolean
  ceiling?: number
  ceiling_mode?: 'lowpass_true_peak' | 'hard_clip' | 'analog_clip'
  oversample?: 1 | 2 | 4 | 8
}

export interface MasteringResponse {
  id: number
  status: 'waiting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  input_audio_id: number
  output_audio_id?: number
  mode: string
  preset: string
  target_loudness: number
  progression?: number
  failure_reason?: string
  created_at: string
  updated_at: string
  mastering_algorithm: string
  output_format: string
  bit_depth: number
  sample_rate: number
  waiting_order?: number
}

class AIMasteringService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.AI_MASTERING_API_KEY || ''
    this.baseUrl = AI_MASTERING_BASE_URL
    
    if (!this.apiKey) {
      console.warn('AI_MASTERING_API_KEY is not configured')
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.apiKey) {
      throw new Error('AI Mastering API key is not configured. Please set AI_MASTERING_API_KEY environment variable.')
    }

    const url = `${this.baseUrl}${endpoint}`
    console.log(`[AI Mastering] Making request to: ${url}`)
    
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          ...options.headers,
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      console.log(`[AI Mastering] Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[AI Mastering] API error: ${response.status} ${response.statusText}`, errorText)
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your AI Mastering API configuration.')
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.')
        } else if (response.status === 502) {
          throw new Error('AI Mastering service is currently experiencing technical difficulties. Please try again in a few minutes.')
        } else if (response.status >= 500) {
          throw new Error('AI Mastering service is temporarily unavailable. Please try again later.')
        }
        
        throw new Error(`AI Mastering API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`[AI Mastering] Success response:`, result)
      return result
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout. The AI Mastering service is taking too long to respond.')
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to AI Mastering service. Please check your internet connection.')
      }
      console.error('[AI Mastering] Request failed:', error)
      throw error
    }
  }

  async uploadAudio(file: File, name?: string): Promise<AudioUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    if (name) {
      formData.append('name', name)
    }

    return this.makeRequest('/audios', {
      method: 'POST',
      body: formData,
    })
  }

  async createMastering(request: MasteringRequest): Promise<MasteringResponse> {
    const formData = new FormData()
    
    // Add all parameters to form data
    Object.entries(request).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString())
      }
    })

    return this.makeRequest('/masterings', {
      method: 'POST',
      body: formData,
    })
  }

  async getMastering(id: number): Promise<MasteringResponse> {
    return this.makeRequest(`/masterings/${id}`)
  }

  async listMasterings(): Promise<MasteringResponse[]> {
    return this.makeRequest('/masterings')
  }

  async getAudio(id: number): Promise<AudioUploadResponse> {
    return this.makeRequest(`/audios/${id}`)
  }

  async getAudioDownloadToken(audioId: number): Promise<{ download_token: string; download_url: string }> {
    return this.makeRequest(`/audios/${audioId}/download_token`)
  }

  async downloadAudio(audioId: number): Promise<Blob> {
    const tokenResponse = await this.getAudioDownloadToken(audioId)
    
    const response = await fetch(tokenResponse.download_url)
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.status}`)
    }
    
    return response.blob()
  }

  async cancelMastering(id: number): Promise<MasteringResponse> {
    return this.makeRequest(`/masterings/${id}/cancel`, {
      method: 'PUT',
    })
  }

  async deleteMastering(id: number): Promise<MasteringResponse> {
    return this.makeRequest(`/masterings/${id}`, {
      method: 'DELETE',
    })
  }
}

export const aiMasteringService = new AIMasteringService()
