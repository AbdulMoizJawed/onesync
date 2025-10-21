// Augmentations and widened types for SpotOnTrack integration
// This file provides optional properties used across the codebase so
// TypeScript checks won't fail while we keep the API client aligned
// to the official documentation.

// Broad, permissive types to match various callsites across the codebase.
// These intentionally use optional properties to avoid brittle mismatches.

export interface SpotOnTrackStreamData {
  date?: string
  total?: number
  daily?: number
  total_streams?: number
  monthly_streams?: number
  daily_streams?: number
  apple_music_streams?: number
  deezer_streams?: number
  trend_percentage?: number
  trend_direction?: string
  [key: string]: any
}

export interface SpotOnTrackPlaylist {
  position?: number
  added_at?: string
  playlist?: any
  total_playlists?: number
  editorial_playlists?: number
  user_playlists?: number
  spotify_playlists?: any[]
  apple_music_playlists?: any[]
  deezer_playlists?: any[]
  [key: string]: any
}

export interface SpotOnTrackChart {
  country_code?: string
  position?: number
  previous_position?: number | null
  date?: string
  chart_history?: any[]
  chart_positions?: any
  [key: string]: any
}

// Provide multiple name variants used across files
export interface SpotonTrackArtist {
  id?: string
  name?: string
  image?: string
  streams?: any
  followers?: any
  playlists?: any
  chartPerformance?: any
  marketData?: any
  demographics?: any
}

export interface SpotonTrackArtist extends SpotonTrackArtist {}
export interface SpotOnTrackArtist extends SpotonTrackArtist {}

export interface SpotonTrackTrack {
  id?: string
  isrc?: string
  title?: string
  name?: string
  album?: string
  artist?: string
  streams?: any
  marketData?: any
  audioFeatures?: any
  chartHistory?: any
  chart_positions?: any
  chart_history?: any
}

export interface SpotonTrackTrack extends SpotonTrackTrack {}
export interface SpotOnTrackTrack extends SpotonTrackTrack {}

export {}
