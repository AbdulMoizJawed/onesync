/**
 * Universal Upload API - Handles all file uploads with Supabase Storage
 * Supports audio, images, and documents
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 30; // 30 seconds for Vercel compatibility

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg']
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'application/msword']

const MAX_AUDIO_SIZE = 100 * 1024 * 1024 // 100MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024 // 25MB

// Helper function to get image dimensions from buffer
async function getImageDimensions(buffer: ArrayBuffer): Promise<{ width: number; height: number }> {
  // Simple JPEG dimension extraction
  const view = new DataView(buffer)
  
  // Check for JPEG signature
  if (view.getUint16(0) !== 0xFFD8) {
    throw new Error('Not a valid JPEG file')
  }
  
  let offset = 2
  while (offset < view.byteLength) {
    const marker = view.getUint16(offset)
    
    if (marker === 0xFFC0 || marker === 0xFFC2) { // SOF0 or SOF2
      const height = view.getUint16(offset + 5)
      const width = view.getUint16(offset + 7)
      return { width, height }
    }
    
    if ((marker & 0xFF00) !== 0xFF00) break
    
    const segmentLength = view.getUint16(offset + 2)
    offset += 2 + segmentLength
  }
  
  throw new Error('Could not extract image dimensions')
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const uploadType = formData.get('type') as string || 'general'
    const folder = formData.get('folder') as string || 'misc'

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 })
    }

    // Validate file type and size
    const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type)
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.type)
    
    if (!isAudio && !isImage && !isDocument) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Special validation for cover art - must be JPG only and exactly 3000x3000
    if (uploadType === 'cover-art') {
      if (file.type !== 'image/jpeg') {
        return NextResponse.json({ error: 'Cover art must be JPG format only' }, { status: 400 })
      }
      
      // Validate image dimensions for cover art
      try {
        const imageBuffer = await file.arrayBuffer()
        const dimensions = await getImageDimensions(imageBuffer)
        
        if (dimensions.width !== 3000 || dimensions.height !== 3000) {
          return NextResponse.json({ 
            error: `Cover art must be exactly 3000x3000 pixels. Current size: ${dimensions.width}x${dimensions.height}` 
          }, { status: 400 })
        }
      } catch (error) {
        return NextResponse.json({ error: 'Failed to validate image dimensions' }, { status: 400 })
      }
    }

    let maxSize = MAX_DOCUMENT_SIZE
    if (isAudio) maxSize = MAX_AUDIO_SIZE
    else if (isImage) maxSize = MAX_IMAGE_SIZE

    if (file.size > maxSize) {
      const maxSizeStr = isAudio ? '100MB' : isImage ? '10MB' : '25MB'
      return NextResponse.json({ 
        error: `File too large. Maximum ${maxSizeStr} allowed.` 
      }, { status: 400 })
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${folder}/${uploadType}/${userId}/${fileName}`

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

    // Save metadata to database
    const { data: fileData, error: dbError } = await supabase
      .from('uploaded_files')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: urlData.publicUrl,
        storage_path: filePath,
        upload_type: uploadType,
        folder: folder,
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file
      await supabase.storage.from('uploads').remove([filePath])
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileData.id,
        url: urlData.publicUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadType: uploadType,
        folder: folder
      }
    })

  } catch (error) {
    console.error('Universal upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const fileId = url.searchParams.get('id')
    const userId = url.searchParams.get('userId')

    if (!fileId || !userId) {
      return NextResponse.json({ error: 'Missing fileId or userId' }, { status: 400 })
    }

    // Get file details
    const { data: fileData, error: fetchError } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !fileData) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('uploads')
      .remove([fileData.storage_path])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('uploaded_files')
      .delete()
      .eq('id', fileId)

    if (dbError) {
      console.error('Database deletion error:', dbError)
      return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('File deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
