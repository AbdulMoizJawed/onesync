/**
 * Universal File Upload Hooks
 * React hooks for handling file uploads across the entire platform
 * Supports music releases, beats, avatars, attachments, and general files
 */

'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { 
  UploadResponse, 
  AvatarUploadResponse, 
  BeatUploadResponse, 
  AttachmentUploadResponse,
  UploadContext, 
  AvatarType, 
  AttachmentContext,
  UseFileUploadOptions,
  UseFileUploadReturn
} from '@/lib/types/storage'

// Legacy interfaces for backward compatibility
export interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

export interface UploadResult {
  key: string
  url: string
  bucket: string
  originalFileName: string
  fileSize: number
  contentType: string
}

export interface LegacyUploadOptions {
  onProgress?: (progress: UploadProgress) => void
  onComplete?: (result: UploadResult) => void
  onError?: (error: string) => void
}

// Universal file upload hook (NEW - recommended)
export function useFileUpload(options: UseFileUploadOptions): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const uploadFile = useCallback(async (
    file: File, 
    metadata?: Record<string, any>
  ): Promise<UploadResponse> => {
    if (!user) {
      const errorMsg = 'User must be authenticated to upload files'
      setError(errorMsg)
      options.onError?.(errorMsg)
      return { success: false, error: errorMsg }
    }

    setIsUploading(true)
    setProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', user.id)
      formData.append('context', options.context)
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata))
      }

      options.onProgress?.(25) // Form prepared
      setProgress(25)

      const response = await fetch('/api/upload/universal', {
        method: 'POST',
        body: formData,
      })

      options.onProgress?.(75) // Upload complete
      setProgress(75)

      const result: UploadResponse = await response.json()

      if (result.success) {
        setProgress(100)
        options.onProgress?.(100)
        options.onSuccess?.(result)
      } else {
        setError(result.error || 'Upload failed')
        options.onError?.(result.error || 'Upload failed')
      }

      return result

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMsg)
      options.onError?.(errorMsg)
      return { success: false, error: errorMsg }

    } finally {
      setIsUploading(false)
    }
  }, [user, options])

  return {
    uploadFile,
    isUploading,
    progress,
    error
  }
}

// Avatar upload hook
export function useAvatarUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const uploadAvatar = useCallback(async (
    file: File, 
    avatarType: AvatarType = 'user'
  ): Promise<AvatarUploadResponse> => {
    if (!user) {
      const errorMsg = 'User must be authenticated to upload avatar'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', user.id)
      formData.append('avatarType', avatarType)

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      const result: AvatarUploadResponse = await response.json()

      if (!result.success) {
        setError(result.error || 'Avatar upload failed')
      }

      return result

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Avatar upload failed'
      setError(errorMsg)
      return { success: false, error: errorMsg }

    } finally {
      setIsUploading(false)
    }
  }, [user])

  const deleteAvatar = useCallback(async (avatarType: AvatarType = 'user') => {
    if (!user) return { success: false, error: 'User not authenticated' }

    try {
      const response = await fetch('/api/upload/avatar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, avatarType }),
      })

      return await response.json()
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Delete failed' }
    }
  }, [user])

  return {
    uploadAvatar,
    deleteAvatar,
    isUploading,
    error
  }
}

// Beat upload hook
export function useBeatUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const { user } = useAuth()

  const uploadBeat = useCallback(async (beatData: {
    title: string
    genre: string
    mood?: string[]
    tags?: string[]
    bpm: number
    key: string
    price: { amount: number; currency: string; license_type: string }
    description?: string
    audioFile: File
    artworkFile?: File
  }): Promise<BeatUploadResponse> => {
    if (!user) {
      const errorMsg = 'User must be authenticated to upload beats'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }

    setIsUploading(true)
    setProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      
      // Add beat metadata
      formData.append('title', beatData.title)
      formData.append('genre', beatData.genre)
      formData.append('bpm', beatData.bpm.toString())
      formData.append('key', beatData.key)
      formData.append('price', JSON.stringify(beatData.price))
      formData.append('userId', user.id)
      
      if (beatData.mood?.length) {
        formData.append('mood', JSON.stringify(beatData.mood))
      }
      if (beatData.tags?.length) {
        formData.append('tags', JSON.stringify(beatData.tags))
      }
      if (beatData.description) {
        formData.append('description', beatData.description)
      }

      // Add files
      formData.append('audio', beatData.audioFile)
      if (beatData.artworkFile) {
        formData.append('artwork', beatData.artworkFile)
      }

      setProgress(25) // Form prepared

      const response = await fetch('/api/beats/upload', {
        method: 'POST',
        body: formData,
      })

      setProgress(75) // Upload complete

      const result: BeatUploadResponse = await response.json()
      
      setProgress(100)

      if (!result.success) {
        setError(result.error || 'Beat upload failed')
      }

      return result

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Beat upload failed'
      setError(errorMsg)
      return { success: false, error: errorMsg }

    } finally {
      setIsUploading(false)
    }
  }, [user])

  return {
    uploadBeat,
    isUploading,
    progress,
    error
  }
}

// Attachment upload hook
export function useAttachmentUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const uploadAttachment = useCallback(async (
    file: File,
    context: AttachmentContext,
    parentId?: string,
    metadata?: Record<string, any>
  ): Promise<AttachmentUploadResponse> => {
    if (!user) {
      const errorMsg = 'User must be authenticated to upload attachments'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', user.id)
      formData.append('context', context)
      if (parentId) {
        formData.append('parentId', parentId)
      }
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata))
      }

      const response = await fetch('/api/upload/attachments', {
        method: 'POST',
        body: formData,
      })

      const result: AttachmentUploadResponse = await response.json()

      if (!result.success) {
        setError(result.error || 'Attachment upload failed')
      }

      return result

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Attachment upload failed'
      setError(errorMsg)
      return { success: false, error: errorMsg }

    } finally {
      setIsUploading(false)
    }
  }, [user])

  const deleteAttachment = useCallback(async (fileId: string) => {
    if (!user) return { success: false, error: 'User not authenticated' }

    try {
      const response = await fetch('/api/upload/attachments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, userId: user.id }),
      })

      return await response.json()
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Delete failed' }
    }
  }, [user])

  const getAttachments = useCallback(async (
    context?: AttachmentContext,
    parentId?: string
  ) => {
    if (!user) return { success: false, error: 'User not authenticated' }

    try {
      const params = new URLSearchParams({ userId: user.id })
      if (context) params.append('context', context)
      if (parentId) params.append('parentId', parentId)

      const response = await fetch(`/api/upload/attachments?${params}`)
      return await response.json()
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Fetch failed' }
    }
  }, [user])

  return {
    uploadAttachment,
    deleteAttachment,
    getAttachments,
    isUploading,
    error
  }
}

// Music release upload hook (hybrid system)
export function useMusicUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const { user } = useAuth()

  const uploadRelease = useCallback(async (releaseData: {
    title: string
    artistName: string
    genre: string
    releaseDate: string
    description?: string
    audioFile: File
    coverFile?: File
    distributionSettings?: {
      distributors: string[]
    }
  }) => {
    if (!user) {
      const errorMsg = 'User must be authenticated to upload music'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }

    setIsUploading(true)
    setProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      
      // Add release metadata
      Object.entries(releaseData).forEach(([key, value]) => {
        if (key !== 'audioFile' && key !== 'coverFile' && value !== undefined) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value)
        }
      })

      formData.append('userId', user.id)
      formData.append('audioFile', releaseData.audioFile)
      if (releaseData.coverFile) {
        formData.append('coverFile', releaseData.coverFile)
      }

      setProgress(25)

      const response = await fetch('/api/upload/hybrid', {
        method: 'POST',
        body: formData,
      })

      setProgress(75)

      const result = await response.json()
      
      setProgress(100)

      if (!result.success) {
        setError(result.error || 'Music upload failed')
      }

      return result

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Music upload failed'
      setError(errorMsg)
      return { success: false, error: errorMsg }

    } finally {
      setIsUploading(false)
    }
  }, [user])

  return {
    uploadRelease,
    isUploading,
    progress,
    error
  }
}

// File management hook
export function useFileManager() {
  const { user } = useAuth()

  const getUserFiles = useCallback(async (folder?: string) => {
    if (!user || !supabase) return { data: [], error: 'User not authenticated or Supabase not configured' }

    try {
      let query = supabase
        .from('uploaded_files')
        .select('*')
        .eq('user_id', user.id)
        .eq('upload_status', 'completed')

      if (folder) {
        query = query.eq('folder', folder)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      return { data: data || [], error: error?.message }
    } catch (err) {
      return { data: [], error: err instanceof Error ? err.message : 'Fetch failed' }
    }
  }, [user])

  const deleteFile = useCallback(async (fileId: string, storageKey: string) => {
    if (!user) return { success: false, error: 'User not authenticated' }

    try {
      const response = await fetch('/api/upload/universal', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, storageKey }),
      })

      return await response.json()
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Delete failed' }
    }
  }, [user])

  const getStorageSummary = useCallback(async () => {
    if (!user || !supabase) return { data: null, error: 'User not authenticated or Supabase not configured' }

    try {
      const { data, error } = await supabase
        .from('user_storage_summary')
        .select('*')
        .eq('user_id', user.id)
        .single()

      return { data, error: error?.message }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Fetch failed' }
    }
  }, [user])

  return {
    getUserFiles,
    deleteFile,
    getStorageSummary
  }
}

// Legacy upload hook for backward compatibility
export function useLegacyUpload(options: LegacyUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)

  const uploadFile = useCallback(async (
    file: File,
    fileType: 'audio' | 'image',
    folder: string,
    userId: string
  ): Promise<UploadResult | null> => {
    if (!file || !userId || !folder) {
      const error = 'Missing required parameters'
      options.onError?.(error)
      return null
    }

    setIsUploading(true)
    setUploadProgress({
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', fileType)
      formData.append('userId', userId)
      formData.append('folder', folder)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (!prev || prev.progress >= 90) return prev
          const newProgress = Math.min(prev.progress + 10, 90)
          options.onProgress?.({
            ...prev,
            progress: newProgress
          })
          return {
            ...prev,
            progress: newProgress
          }
        })
      }, 200)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      const finalProgress: UploadProgress = {
        fileName: file.name,
        progress: 100,
        status: 'completed'
      }

      setUploadProgress(finalProgress)
      options.onProgress?.(finalProgress)
      options.onComplete?.(result.data)

      return result.data

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      
      const errorProgress: UploadProgress = {
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: errorMessage
      }

      setUploadProgress(errorProgress)
      options.onProgress?.(errorProgress)
      options.onError?.(errorMessage)

      return null

    } finally {
      setIsUploading(false)
      
      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(null)
      }, 3000)
    }
  }, [options])

  const uploadMultipleFiles = useCallback(async (
    files: File[],
    fileType: 'audio' | 'image',
    folder: string,
    userId: string
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = []
    
    for (const file of files) {
      const result = await uploadFile(file, fileType, folder, userId)
      if (result) {
        results.push(result)
      }
    }
    
    return results
  }, [uploadFile])

  // Presigned URL upload for direct client uploads
  const uploadWithPresignedUrl = useCallback(async (
    file: File,
    key: string
  ): Promise<boolean> => {
    try {
      setIsUploading(true)
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      })

      // Get presigned URL
      const response = await fetch(
        `/api/upload?action=presigned-url&key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(file.type)}`
      )

      if (!response.ok) {
        throw new Error('Failed to get presigned URL')
      }

      const { data } = await response.json()
      
      // Upload directly to storage
      const uploadResponse = await fetch(data.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to storage')
      }

      setUploadProgress({
        fileName: file.name,
        progress: 100,
        status: 'completed'
      })

      return true

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: errorMessage
      })

      options.onError?.(errorMessage)
      return false

    } finally {
      setIsUploading(false)
    }
  }, [options])

  return {
    uploadFile,
    uploadMultipleFiles,
    uploadWithPresignedUrl,
    isUploading,
    uploadProgress,
  }
}

// Helper function to validate files before upload
export function validateFileForUpload(
  file: File,
  type: 'audio' | 'image'
): { isValid: boolean; error?: string } {
  const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg']
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  
  const maxSizes = {
    audio: 100 * 1024 * 1024, // 100MB
    image: 10 * 1024 * 1024,  // 10MB
  }

  const allowedTypes = type === 'audio' ? audioTypes : imageTypes
  const maxSize = maxSizes[type]

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    return {
      isValid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`
    }
  }

  return { isValid: true }
}
