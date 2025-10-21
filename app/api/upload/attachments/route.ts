/**
 * Comment Attachments Upload API
 * Handles file attachments for forum posts, comments, and community content
 * Files & Metadata → Supabase Storage only
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024 // 25MB for attachments
const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac',
  'video/mp4', 'video/quicktime'
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const attachmentContext = formData.get('context') as string
    const parentId = formData.get('parentId') as string
    const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : {}

    if (!file || !userId || !attachmentContext) {
      return NextResponse.json(
        { error: 'Missing required fields: file, userId, context' },
        { status: 400 }
      )
    }

    // Validate file
    if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `attachments/${attachmentContext}/${userId}/${fileName}`

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

    // Save attachment metadata to database
    const { data: attachmentData, error: dbError } = await supabase
      .from('attachments')
      .insert({
        user_id: userId,
        context: attachmentContext,
        parent_id: parentId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: urlData.publicUrl,
        storage_path: filePath,
        metadata: metadata,
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
      attachment: {
        id: attachmentData.id,
        url: urlData.publicUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        context: attachmentContext,
        parentId: parentId
      }
    })

  } catch (error) {
    console.error('Attachment upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const attachmentId = url.searchParams.get('id')
    const userId = url.searchParams.get('userId')

    if (!attachmentId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get attachment details
    const { data: attachment, error: fetchError } = await supabase
      .from('attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('uploads')
      .remove([attachment.storage_path])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('attachments')
      .delete()
      .eq('id', attachmentId)

    if (dbError) {
      console.error('Database deletion error:', dbError)
      return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Attachment deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
