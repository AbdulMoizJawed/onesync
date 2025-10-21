'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle, FileIcon, ImageIcon, MusicIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useHybridStorage, UploadedFile, UploadProgress } from '@/hooks/use-hybrid-storage'
import { cn } from '@/lib/utils'

interface HybridFileUploadProps {
  fileType: 'audio' | 'image'
  folder: string
  userId: string
  onUploadComplete?: (files: UploadedFile[]) => void
  onUploadError?: (error: Error) => void
  multiple?: boolean
  maxFiles?: number
  className?: string
  disabled?: boolean
}

export default function HybridFileUpload({
  fileType,
  folder,
  userId,
  onUploadComplete,
  onUploadError,
  multiple = true,
  maxFiles = 10,
  className,
  disabled = false
}: HybridFileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)

  const { uploadFiles, isUploading } = useHybridStorage({
    onProgress: setUploadProgress,
    onComplete: (files: UploadedFile[]) => {
      setUploadedFiles(prev => [...prev, ...files])
      onUploadComplete?.(files)
    },
    onError: onUploadError
  })

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length || isUploading) return

    const filesToUpload = multiple 
      ? acceptedFiles.slice(0, maxFiles - uploadedFiles.length)
      : acceptedFiles.slice(0, 1)

    try {
      await uploadFiles(filesToUpload, fileType, folder, userId)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }, [uploadFiles, fileType, folder, userId, multiple, maxFiles, uploadedFiles.length, isUploading])

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: fileType === 'audio' ? {
      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.ogg']
    } : {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    },
    multiple,
    maxFiles: multiple ? maxFiles : 1,
    disabled: disabled || isUploading
  })

  const getFileIcon = (file: UploadedFile) => {
    if (file.type.startsWith('audio/')) {
      return <MusicIcon className="h-5 w-5" />
    } else if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5" />
    }
    return <FileIcon className="h-5 w-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive 
            ? 'border-primary bg-primary/10' 
            : 'border-muted-foreground/25 hover:border-primary/50',
          (disabled || isUploading) && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-2">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
          
          {isDragActive ? (
            <p className="text-sm text-primary">Drop files here...</p>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">
                Drag & drop {fileType} files here, or click to select
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {fileType === 'audio' && 'Supports: MP3, WAV, FLAC, AAC, OGG (max 100MB each)'}
                {fileType === 'image' && 'Supports: JPG, PNG, WebP, GIF (max 10MB each)'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && uploadProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{uploadProgress.message}</span>
            <span className="text-muted-foreground">{Math.round(uploadProgress.progress)}%</span>
          </div>
          <Progress value={uploadProgress.progress} className="w-full" />
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Uploaded Files ({uploadedFiles.length})
          </h4>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadedFiles.map((file, index) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(file)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="ml-2 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Stats */}
      {!multiple && uploadedFiles.length >= 1 && (
        <p className="text-xs text-muted-foreground">
          Maximum of 1 file allowed. Remove the current file to upload a new one.
        </p>
      )}
      
      {multiple && uploadedFiles.length >= maxFiles && (
        <p className="text-xs text-muted-foreground">
          Maximum of {maxFiles} files reached. Remove files to upload more.
        </p>
      )}
    </div>
  )
}
