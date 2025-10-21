/**
 * Avatar Upload API - Handles all avatar uploads (forum, user profile, producer)
 * Files & Metadata → Supabase Storage only
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB for avatars
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const avatarType = formData.get('type') as string // 'profile', 'forum', 'producer'

    if (!file || !userId || !avatarType) {
      return NextResponse.json(
        { error: 'Missing required fields: file, userId, type' },
        { status: 400 }
      )
    }

    // Validate file
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images allowed.' }, { status: 400 })
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 5MB allowed.' }, { status: 400 })
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `avatars/${avatarType}/${userId}/${fileName}`

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

    // Update user avatar in database
    const updateField = avatarType === 'profile' ? 'avatar_url' : `${avatarType}_avatar_url`
    
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ [updateField]: urlData.publicUrl })
      .eq('id', userId)

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file
      await supabase.storage.from('uploads').remove([filePath])
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      avatarUrl: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      avatarType: avatarType
    })

  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const avatarType = url.searchParams.get('type') || 'profile'

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Get current avatar URL
    const fieldName = avatarType === 'profile' ? 'avatar_url' : `${avatarType}_avatar_url`
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select(fieldName)
      .eq('id', userId)
      .single()

    if (fetchError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const currentAvatarUrl = (profile as any)[fieldName]
    
    if (currentAvatarUrl) {
      // Extract storage path from URL
      const urlParts = currentAvatarUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const storagePath = `avatars/${avatarType}/${userId}/${fileName}`

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('uploads')
        .remove([storagePath])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
      }
    }

    // Remove avatar URL from database
    const updateField = avatarType === 'profile' ? 'avatar_url' : `${avatarType}_avatar_url`
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ [updateField]: null })
      .eq('id', userId)

    if (dbError) {
      console.error('Database deletion error:', dbError)
      return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Avatar deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
