import { NextRequest, NextResponse } from 'next/server'
import { aiMasteringService } from '@/lib/ai-mastering'

export async function POST(request: NextRequest) {
  try {
    console.log('[Mastering Upload] Received upload request')
    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string

    console.log('[Mastering Upload] File:', name, 'Type:', file?.type, 'Size:', file?.size)

    if (!file) {
      console.error('[Mastering Upload] No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/flac',
      'audio/aac',
      'audio/ogg',
      'audio/m4a'
    ]

    if (!allowedTypes.includes(file.type)) {
      console.error('[Mastering Upload] Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an audio file.' },
        { status: 400 }
      )
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      console.error('[Mastering Upload] File too large:', file.size)
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB.' },
        { status: 400 }
      )
    }

    console.log('[Mastering Upload] Uploading to AI Mastering API...')
    // Upload to AI Mastering API
    const result = await aiMasteringService.uploadAudio(file, name)
    console.log('[Mastering Upload] Upload successful:', result.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Mastering Upload] Upload error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to upload audio file' },
      { status: 500 }
    )
  }
}
