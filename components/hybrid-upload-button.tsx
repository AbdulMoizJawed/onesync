'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Upload } from 'lucide-react'
import { uploadReleaseHybrid, saveDraftHybrid, ReleaseUploadData } from '@/lib/hybrid-upload'

interface HybridUploadButtonProps {
  uploadData: ReleaseUploadData
  userId: string
  onSuccess?: (releaseId: string) => void
  onError?: (error: Error) => void
  isDraft?: boolean
  disabled?: boolean
  children?: React.ReactNode
}

export default function HybridUploadButton({
  uploadData,
  userId,
  onSuccess,
  onError,
  isDraft = false,
  disabled = false,
  children
}: HybridUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleUpload = async () => {
    setIsUploading(true)
    setUploadProgress(0)
    setUploadMessage('')
    setUploadError(null)
    setUploadSuccess(false)

    try {
      const progressCallback = (progress: number, message: string) => {
        setUploadProgress(progress)
        setUploadMessage(message)
      }

      let releaseId: string

      if (isDraft) {
        releaseId = await saveDraftHybrid(uploadData, userId, progressCallback)
      } else {
        releaseId = await uploadReleaseHybrid(uploadData, userId, progressCallback)
      }

      setUploadSuccess(true)
      setUploadMessage(isDraft ? 'Draft saved successfully!' : 'Release uploaded successfully!')
      onSuccess?.(releaseId)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setUploadError(errorMessage)
      onError?.(error instanceof Error ? error : new Error(errorMessage))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleUpload}
        disabled={disabled || isUploading}
        className="w-full"
        size="lg"
      >
        {isUploading ? (
          <>
            <Upload className="mr-2 h-4 w-4 animate-spin" />
            {isDraft ? 'Saving Draft...' : 'Uploading...'}
          </>
        ) : (
          children || (isDraft ? 'Save Draft' : 'Upload Release')
        )}
      </Button>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{uploadMessage}</span>
            <span className="text-muted-foreground">{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {uploadSuccess && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {isDraft ? 'Draft saved successfully!' : 'Release uploaded successfully!'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
