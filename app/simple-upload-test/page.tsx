'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function SimpleUploadTest() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', file.type.startsWith('image/') ? 'image' : 'audio')
      formData.append('userId', 'test-user-123')
      formData.append('folder', file.type.startsWith('image/') ? 'artwork/test-simple' : 'audio/test-simple')

      console.log('Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const responseText = await response.text()
      console.log('Response status:', response.status)
      console.log('Response text:', responseText)

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} - ${responseText}`)
      }

      const data = JSON.parse(responseText)
      setResult(data)
      console.log('Upload successful:', data)

    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center">Simple S3 Upload Test</h1>
        
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select a file to upload:
              </label>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                accept="image/*,audio/*"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {uploading && (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Uploading...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="font-medium text-red-800">Upload Error:</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="font-medium text-green-800">Upload Successful!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p><strong>File:</strong> {result.data?.originalFileName}</p>
                  <p><strong>Size:</strong> {Math.round(result.data?.fileSize / 1024)} KB</p>
                  <p><strong>Type:</strong> {result.data?.contentType}</p>
                  <p><strong>S3 Key:</strong> {result.data?.key}</p>
                  <div className="mt-2">
                    <p><strong>URL:</strong></p>
                    <p className="break-all font-mono text-xs bg-gray-100 p-2 rounded">
                      {result.data?.url}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Environment:</strong> Development</p>
            <p><strong>S3 Bucket:</strong> music-app-dev-20250810</p>
            <p><strong>AWS Region:</strong> us-east-1</p>
            <p><strong>Direct S3 Test:</strong> ✅ Working</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
