'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle, Music, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { useFileUpload, validateFileForUpload, UploadResult, UploadProgress } from '@/hooks/use-file-upload'
import { UploadContext } from '@/lib/types/storage'
import { cn } from '@/lib/utils'

interface FileUploadComponentProps {
  fileType: 'audio' | 'image'
  folder: string
  userId: string
  multiple?: boolean
  onUploadComplete?: (results: UploadResult[]) => void
  onUploadError?: (error: string) => void
  className?: string
  maxFiles?: number
  children?: React.ReactNode
}

interface FileWithId extends File {
  id: string
}

export function FileUploadComponent({
  fileType,
  folder,
  userId,
  multiple = false,
  onUploadComplete,
  onUploadError,
  className,
  maxFiles = 10,
  children
}: FileUploadComponentProps) {
  const [files, setFiles] = useState<FileWithId[]>([])
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [currentUpload, setCurrentUpload] = useState<UploadProgress | null>(null)

  const { uploadFile, isUploading } = useFileUpload({
    context: 'general' as UploadContext,
    onProgress: (progress) => {
      setCurrentUpload({
        fileName: '',
        progress,
        status: 'uploading'
      })
    },
    onSuccess: (result) => {
      if (result.success && result.file) {
        setUploadResults(prev => [...prev, {
          key: result.file!.key,
          url: result.file!.url,
          bucket: result.file!.bucket,
          originalFileName: result.file!.name,
          fileSize: result.file!.size,
          contentType: result.file!.type
        }])
      }
      setCurrentUpload(null)
    },
    onError: (error) => {
      onUploadError?.(error)
      setCurrentUpload(null)
    }
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles: FileWithId[] = []
    
    for (const file of acceptedFiles) {
      const validation = validateFileForUpload(file, fileType)
      
      if (validation.isValid) {
        const fileWithId = Object.assign(file, {
          id: Math.random().toString(36).substring(2)
        })
        validFiles.push(fileWithId)
      } else {
        onUploadError?.(validation.error || 'Invalid file')
      }
    }

    if (!multiple) {
      setFiles(validFiles.slice(0, 1))
    } else {
      setFiles(prev => [...prev, ...validFiles].slice(0, maxFiles))
    }
  }, [fileType, multiple, maxFiles, onUploadError])

  const audioFileTypes = {
    'audio/mpeg': ['.mp3'],
    'audio/wav': ['.wav'],
    'audio/flac': ['.flac'],
    'audio/aac': ['.aac'],
    'audio/ogg': ['.ogg']
  }

  const imageFileTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif']
  }

  const acceptedFileTypes = fileType === 'audio' ? audioFileTypes : imageFileTypes

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    multiple,
    disabled: isUploading,
    maxFiles
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    const results: UploadResult[] = []
    
    for (const file of files) {
      const result = await uploadFile(file, { folder, fileType })
      if (result.success && result.file) {
        results.push({
          key: result.file.key,
          url: result.file.url,
          bucket: result.file.bucket,
          originalFileName: result.file.name,
          fileSize: result.file.size,
          contentType: result.file.type
        })
      }
    }

    if (results.length > 0) {
      onUploadComplete?.(results)
      setFiles([]) // Clear files after successful upload
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('audio/')) {
      return <Music className="h-8 w-8 text-blue-500" />
    } else if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-green-500" />
    }
    return <Upload className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
          isUploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        
        {children || (
          <>
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {isDragActive ? 'Drop files here' : `Upload ${fileType} files`}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Drag & drop or click to select {multiple ? 'files' : 'a file'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {fileType === 'audio' 
                ? 'Supports MP3, WAV, FLAC, AAC, OGG (max 100MB)'
                : 'Supports JPEG, PNG, WebP, GIF (max 10MB)'
              }
            </p>
          </>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Selected Files ({files.length})
          </h4>
          
          {files.map((file) => (
            <Card key={file.id} className="p-3">
              <div className="flex items-center space-x-3">
                {getFileIcon(file)}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}

          <Button 
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className="w-full"
          >
            {isUploading ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      )}

      {/* Upload Progress */}
      {currentUpload && (
        <Card className="mt-4 p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Uploading {currentUpload.fileName}
              </p>
              
              {currentUpload.status === 'completed' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              
              {currentUpload.status === 'error' && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>

            <Progress value={currentUpload.progress} className="h-2" />
            
            <p className="text-xs text-gray-500">
              {currentUpload.progress}% complete
            </p>

            {currentUpload.error && (
              <p className="text-xs text-red-500">
                Error: {currentUpload.error}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <Card className="mt-4 p-4">
          <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">
            Successfully Uploaded ({uploadResults.length})
          </h4>
          
          <div className="space-y-1">
            {uploadResults.map((result, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-600 dark:text-gray-300 truncate">
                  {result.originalFileName}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default FileUploadComponent
