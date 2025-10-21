import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configure route for large file uploads
export const runtime = 'nodejs'
export const maxDuration = 30; // 30 seconds for Vercel compatibility

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ALLOWED_AUDIO_TYPES = ['audio/wav', 'audio/wave', 'audio/x-wav']
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_AUDIO_SIZE = 100 * 1024 * 1024 // 100MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const uploadType = formData.get('type') as string || 'general'

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 })
    }

    // Validate file type and size
    const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type)
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    
    if (!isAudio && !isImage) {
      return NextResponse.json({ 
        error: isAudio ? 
          'Invalid audio format. Only WAV files (16-bit or 24-bit at 44.1kHz or 48kHz) are accepted for professional distribution.' :
          'Invalid file type. Only JPG, PNG, and WebP images are accepted.'
      }, { status: 400 })
    }

    const maxSize = isAudio ? MAX_AUDIO_SIZE : MAX_IMAGE_SIZE
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Maximum ${isAudio ? '100MB' : '10MB'} allowed.` 
      }, { status: 400 })
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `uploads/${uploadType}/${userId}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      storagePath: filePath
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
