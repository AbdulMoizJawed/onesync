/**
 * Universal Storage Types
 * TypeScript definitions for the Supabase storage system
 */

export interface UploadedFile {
  id: string
  user_id: string
  file_name: string
  original_name?: string
  file_type: string
  file_size: number
  storage_key: string
  storage_bucket: string
  storage_url: string
  folder: string
  upload_status: 'pending' | 'uploading' | 'completed' | 'failed' | 'deleted'
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Beat {
  id: string
  user_id: string
  title: string
  description?: string
  genre: string
  mood: string[]
  tags: string[]
  bpm: number
  key: string
  price: {
    amount: number
    currency: string
    license_type: string
  }
  audio_storage_url: string
  audio_storage_key: string
  artwork_storage_url?: string
  artwork_storage_key?: string
  upload_status: 'pending' | 'processing' | 'completed' | 'failed'
  is_public: boolean
  download_count: number
  play_count: number
  beatstars_id?: string
  beatstars_url?: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  username?: string
  full_name?: string
  bio?: string
  website?: string
  location?: string
  avatar_url?: string
  avatar_storage_key?: string
  social_links: Record<string, string>
  is_public: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface ProducerProfile {
  id: string
  user_id: string
  producer_name: string
  bio?: string
  specialties: string[]
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'professional'
  avatar_url?: string
  avatar_storage_key?: string
  banner_url?: string
  banner_storage_key?: string
  contact_email?: string
  booking_info: Record<string, any>
  total_beats: number
  total_sales: number
  avg_rating: number
  created_at: string
  updated_at: string
}

export interface ForumAttachment {
  id: string
  user_id: string
  post_id?: string
  file_id: string
  file_url: string
  file_name: string
  file_type: string
  file_size: number
  storage_key: string
  is_image: boolean
  is_audio: boolean
  is_video: boolean
  created_at: string
  updated_at: string
}

export interface CommunityAttachment {
  id: string
  user_id: string
  parent_id?: string
  context_type: string
  file_id: string
  file_url: string
  file_name: string
  file_type: string
  file_size: number
  storage_key: string
  created_at: string
  updated_at: string
}

export interface Release {
  id: string
  user_id: string
  title: string
  artist_name: string
  genre: string
  release_date: string
  description?: string
  audio_storage_url?: string
  audio_storage_key?: string
  cover_storage_url?: string
  cover_storage_key?: string
  status: 'pending' | 'uploading' | 'completed' | 'failed'
  catalog_number?: string
  isrc?: string
  upc?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

// Upload context types
export type UploadContext = 
  | 'music/releases'
  | 'beats/audio'
  | 'beats/artwork'
  | 'samples/audio'
  | 'users/avatars'
  | 'forum/avatars'
  | 'producers/avatars'
  | 'releases/covers'
  | 'albums/artwork'
  | 'playlists/covers'
  | 'forum/attachments'
  | 'comments/images'
  | 'community/media'
  | 'documents/contracts'
  | 'documents/receipts'
  | 'documents/press-kits'
  | 'temp/uploads'

export type AvatarType = 'user' | 'forum' | 'producer'

export type AttachmentContext = 
  | 'forum_post'
  | 'forum_comment'
  | 'community_post'
  | 'comment_reply'
  | 'discussion'

// API Response types
export interface UploadResponse {
  success: boolean
  file?: {
    id: string
    url: string
    key: string
    bucket: string
    name: string
    size: number
    type: string
    context: string
  }
  error?: string
  details?: string
}

export interface AvatarUploadResponse {
  success: boolean
  avatar?: {
    id: string
    url: string
    key: string
    bucket: string
    type: AvatarType
    name: string
    size: number
  }
  error?: string
  details?: string
}

export interface BeatUploadResponse {
  success: boolean
  beat?: {
    id: string
    title: string
    genre: string
    bpm: number
    key: string
    price: Beat['price']
    audioUrl: string
    artworkUrl?: string
    createdAt: string
  }
  error?: string
  details?: string
}

export interface AttachmentUploadResponse {
  success: boolean
  attachment?: {
    id: string
    url: string
    key: string
    bucket: string
    name: string
    size: number
    type: string
    context: AttachmentContext
    parentId?: string
  }
  error?: string
  details?: string
}

// Storage summary types
export interface UserStorageSummary {
  user_id: string
  total_files: number
  total_bytes: number
  total_mb: number
  music_files: number
  beat_files: number
  avatar_files: number
  community_files: number
}

export interface PublicBeatWithCreator extends Beat {
  creator_username?: string
  creator_name?: string
  creator_avatar?: string
  producer_name?: string
  producer_rating?: number
}

// File validation types
export interface FileValidation {
  isValid: boolean
  error?: string
}

export interface UploadOptions {
  folder: string
  fileName: string
  contentType: string
  metadata?: Record<string, string>
}

export interface StorageUploadResult {
  url: string
  key: string
  bucket: string
}

// Hook types for React components
export interface UseFileUploadOptions {
  context: UploadContext
  maxSize?: number
  allowedTypes?: string[]
  onProgress?: (progress: number) => void
  onSuccess?: (result: UploadResponse) => void
  onError?: (error: string) => void
}

export interface UseFileUploadReturn {
  uploadFile: (file: File, metadata?: Record<string, any>) => Promise<UploadResponse>
  isUploading: boolean
  progress: number
  error: string | null
}

// Database table types for Supabase
export interface Database {
  public: {
    Tables: {
      uploaded_files: {
        Row: UploadedFile
        Insert: Omit<UploadedFile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UploadedFile, 'id' | 'created_at'>>
      }
      beats: {
        Row: Beat
        Insert: Omit<Beat, 'id' | 'created_at' | 'updated_at' | 'download_count' | 'play_count'>
        Update: Partial<Omit<Beat, 'id' | 'created_at'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      producer_profiles: {
        Row: ProducerProfile
        Insert: Omit<ProducerProfile, 'id' | 'created_at' | 'updated_at' | 'total_beats' | 'total_sales' | 'avg_rating'>
        Update: Partial<Omit<ProducerProfile, 'id' | 'created_at'>>
      }
      forum_attachments: {
        Row: ForumAttachment
        Insert: Omit<ForumAttachment, 'id' | 'created_at' | 'updated_at' | 'is_image' | 'is_audio' | 'is_video'>
        Update: Partial<Omit<ForumAttachment, 'id' | 'created_at'>>
      }
      community_attachments: {
        Row: CommunityAttachment
        Insert: Omit<CommunityAttachment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CommunityAttachment, 'id' | 'created_at'>>
      }
      releases: {
        Row: Release
        Insert: Omit<Release, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Release, 'id' | 'created_at'>>
      }
    }
    Views: {
      user_storage_summary: {
        Row: UserStorageSummary
      }
      public_beats_with_creators: {
        Row: PublicBeatWithCreator
      }
    }
  }
}
