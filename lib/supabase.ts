// Central supabase barrel exporting runtime client, admin client and config helpers
export { createAdminClient } from './supabase/admin'
export { supabase as runtimeSupabase, BUCKET_NAME } from './supabase/index'
// Re-export env validation helper expected by legacy imports
export { hasValidSupabaseConfig } from './env-config'

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          username: string | null
          bio: string | null
          role: string | null
          publishing_enabled: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          bio?: string | null
          role?: string | null
          publishing_enabled?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          bio?: string | null
          role?: string | null
          publishing_enabled?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      artists: {
        Row: {
          id: string
          user_id: string
          name: string
          bio: string | null
          image: string | null
          image_url: string | null
          avatar_url: string | null
          spotify_url: string | null
          genre: string | null
          location: string | null
          spotify_id: string | null
          apple_music_id: string | null
          instagram_handle: string | null
          twitter_handle: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          bio?: string | null
          image?: string | null
          image_url?: string | null
          avatar_url?: string | null
          spotify_url?: string | null
          genre?: string | null
          location?: string | null
          spotify_id?: string | null
          apple_music_id?: string | null
          instagram_handle?: string | null
          twitter_handle?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          bio?: string | null
          image?: string | null
          image_url?: string | null
          avatar_url?: string | null
          spotify_url?: string | null
          genre?: string | null
          location?: string | null
          spotify_id?: string | null
          apple_music_id?: string | null
          instagram_handle?: string | null
          twitter_handle?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      releases: {
        Row: {
          id: string
          artist_id: string
          title: string
          type: string
          release_date: string | null
          artwork_url: string | null
          cover_art_url: string | null
          audio_url: string | null
          artist_name: string | null
          genre: string | null
          streams: number | null
          revenue: number | null
          platforms: string[] | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          title: string
          type: string
          release_date?: string | null
          artwork_url?: string | null
          cover_art_url?: string | null
          audio_url?: string | null
          artist_name?: string | null
          genre?: string | null
          streams?: number | null
          revenue?: number | null
          platforms?: string[] | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          title?: string
          type?: string
          release_date?: string | null
          artwork_url?: string | null
          cover_art_url?: string | null
          audio_url?: string | null
          artist_name?: string | null
          genre?: string | null
          streams?: number | null
          revenue?: number | null
          platforms?: string[] | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Type aliases for convenience
export type Artist = Database['public']['Tables']['artists']['Row']
export type ArtistWithEarnings = Artist & { earnings?: number }
export type ArtistCollaboration = {
  id: string
  artist_id: string
  collaborator_id: string
  role: string
  status: string
  collaboration_type: string
  revenue_split_percentage: number
  notes: string | null
  percentage: number
  created_at: string
}
export type RevenueSplit = {
  id: string
  release_id: string
  artist_id: string
  percentage: number
  role: string
  created_at: string
}

// Keep legacy export name supabase (wrap runtimeSupabase which may be null when misconfigured)
import { supabase as internalSupabase } from './supabase/index'
export const supabase = internalSupabase
export default supabase
