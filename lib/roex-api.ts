// ROEX API Integration - Audio mastering service integration
// Configure ROEX_API_KEY environment variable to enable functionality

export type MusicalStyle = 
  | "pop" 
  | "rock" 
  | "hip-hop" 
  | "electronic" 
  | "jazz" 
  | "classical" 
  | "country" 
  | "r&b" 
  | "reggae" 
  | "folk" 
  | "metal" 
  | "punk" 
  | "blues" 
  | "ambient" 
  | "experimental"

export type LoudnessPreset = 
  | "streaming" 
  | "radio" 
  | "cd" 
  | "vinyl" 
  | "loud" 
  | "dynamic" 
  | "custom"

export type SampleRate = 44100 | 48000 | 88200 | 96000 | 192000

export const MUSICAL_STYLES: MusicalStyle[] = [
  "pop",
  "rock", 
  "hip-hop",
  "electronic",
  "jazz",
  "classical",
  "country",
  "r&b",
  "reggae",
  "folk",
  "metal",
  "punk",
  "blues",
  "ambient",
  "experimental"
]

export const LOUDNESS_PRESETS: LoudnessPreset[] = [
  "streaming",
  "radio", 
  "cd",
  "vinyl",
  "loud",
  "dynamic",
  "custom"
]

export const SAMPLE_RATES: SampleRate[] = [
  44100,
  48000,
  88200,
  96000,
  192000
]

export function getMusicalStyleDisplayName(style: MusicalStyle): string {
  const displayNames: Record<MusicalStyle, string> = {
    "pop": "Pop",
    "rock": "Rock",
    "hip-hop": "Hip-Hop",
    "electronic": "Electronic",
    "jazz": "Jazz", 
    "classical": "Classical",
    "country": "Country",
    "r&b": "R&B",
    "reggae": "Reggae",
    "folk": "Folk",
    "metal": "Metal",
    "punk": "Punk",
    "blues": "Blues",
    "ambient": "Ambient",
    "experimental": "Experimental"
  }
  
  return displayNames[style] || style
}

export interface MixAnalysisResults {
  loudness: {
    integrated: number
    range: number
    peak: number
    truePeak: number
  }
  dynamics: {
    crestFactor: number
    punchiness: number
    dynamicRange: number
  }
  frequency: {
    bass: number
    mids: number
    treble: number
    balance: string
  }
  stereo: {
    width: number
    correlation: number
    balance: number
  }
  recommendations: string[]
  warnings: string[]
  // Legacy payload property for compatibility with existing components
  payload: {
    integrated_loudness_lufs: number
    peak_loudness_dbfs: number
    sample_rate: number
    bit_depth: number
    stereo_field: string
    clipping: string
    phase_issues: boolean
    mono_compatible: boolean
    tonal_profile: {
      bass_frequency: string
      low_mid_frequency: string
      high_mid_frequency: string
      high_frequency: string
    }
    if_mix_loudness: number
    if_mix_drc: number
    if_master_loudness: number
    if_master_drc: number
    summary?: string
  }
}

export function formatLoudness(value: number): string {
  return `${value.toFixed(1)} LUFS`
}

export function formatDynamicRange(value: number): string {
  return `${value.toFixed(1)} LU`
}

export function getContentTypeFromFile(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()
  
  const mimeTypes: Record<string, string> = {
    'wav': 'audio/wav',
    'mp3': 'audio/mpeg',
    'flac': 'audio/flac',
    'aiff': 'audio/aiff',
    'aif': 'audio/aiff',
    'ogg': 'audio/ogg',
    'm4a': 'audio/mp4'
  }
  
  return mimeTypes[extension || ''] || 'audio/wav'
}

// Placeholder ROEX client - replace with actual implementation
export class ROEXClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl = 'https://api.roex.com') {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  async analyzeMix(audioInput: File | { audioFileLocation: string; musicalStyle: string; isMaster: boolean }): Promise<MixAnalysisResults> {
    if (!this.apiKey) {
      throw new Error('ROEX API key not configured. Please set ROEX_API_KEY environment variable.')
    }

    // TODO: Implement actual ROEX API integration
    throw new Error('ROEX API integration not yet implemented. Please contact support for assistance.')
  }

  async checkStatus(jobId: string): Promise<{ status: string; progress?: number; result?: MixAnalysisResults }> {
    if (!this.apiKey) {
      throw new Error('ROEX API key not configured. Please set ROEX_API_KEY environment variable.')
    }

    // TODO: Implement actual ROEX API integration
    throw new Error('ROEX API integration not yet implemented. Please contact support for assistance.')
  }

  async retrievePreviewMaster(taskId: string): Promise<{ error?: boolean; previewMasterTaskResults?: any }> {
    if (!this.apiKey) {
      throw new Error('ROEX API key not configured. Please set ROEX_API_KEY environment variable.')
    }

    // TODO: Implement actual ROEX API integration
    throw new Error('ROEX API integration not yet implemented. Please contact support for assistance.')
  }

  async retrieveFullMaster(taskId: string): Promise<{ error?: boolean; fullMasterTaskResults?: any }> {
    if (!this.apiKey) {
      throw new Error('ROEX API key not configured. Please set ROEX_API_KEY environment variable.')
    }

    // TODO: Implement actual ROEX API integration
    throw new Error('ROEX API integration not yet implemented. Please contact support for assistance.')
  }
}

// Export default client instance
export const roexClient = new ROEXClient(
  process.env.ROEX_API_KEY || ''
)
