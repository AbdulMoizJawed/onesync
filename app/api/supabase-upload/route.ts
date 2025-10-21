import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configure for larger file uploads
export const runtime = 'nodejs'
export const maxDuration = 120; // 2 minutes for Vercel compatibility

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
  console.log('📤 Supabase upload API called')
  
  try {
    // Set longer request timeout
    const requestTimeout = 110000; // 110 seconds (just under 2 minutes)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Upload request timeout - file may be too large')), requestTimeout)
    );
    
    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        },
        global: {
          fetch: fetch.bind(globalThis)
        }
      }
    )
    
    // Get form data with files
    const formData = await request.formData()
    
    // Extract fields
    const releaseFolder = formData.get('releaseFolder') as string
    const userId = formData.get('userId') as string
    
    // Validate required fields
    if (!releaseFolder) {
      return NextResponse.json({ 
        success: false, 
        error: 'Release folder is required' 
      }, { status: 400 })
    }
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 })
    }
    
    // Extract files
    const coverArt = formData.get('coverArt') as File
    
    // Audio files may be multiple
    const audioFiles: File[] = []
    
    // Loop through all form entries to find audio files
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('audioFile') && value instanceof File) {
        audioFiles.push(value)
      }
    }
    
    // Validate files
    if (!coverArt) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cover art is required' 
      }, { status: 400 })
    }

    // Validate cover art format and dimensions
    if (coverArt.type !== 'image/jpeg') {
      return NextResponse.json({ 
        success: false, 
        error: 'Cover art must be JPG format only' 
      }, { status: 400 })
    }

    // Validate cover art dimensions
    try {
      const imageBuffer = await coverArt.arrayBuffer()
      const dimensions = await getImageDimensions(imageBuffer)
      
      if (dimensions.width !== 3000 || dimensions.height !== 3000) {
        return NextResponse.json({ 
          success: false,
          error: `Cover art must be exactly 3000x3000 pixels. Current size: ${dimensions.width}x${dimensions.height}` 
        }, { status: 400 })
      }
    } catch (error) {
      return NextResponse.json({ 
        success: false,
        error: 'Failed to validate cover art dimensions' 
      }, { status: 400 })
    }
    
    if (audioFiles.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'At least one audio file is required' 
      }, { status: 400 })
    }
    
    console.log(`🔍 Processing ${audioFiles.length} audio files for release folder ${releaseFolder}`)
    console.log(`   Cover art: ${coverArt.name} (${(coverArt.size / 1024 / 1024).toFixed(1)}MB)`)
    audioFiles.forEach((file, index) => {
      console.log(`   Audio ${index + 1}: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
    })
    
    // 1. Upload cover art to Supabase Storage
    console.log('📸 Uploading cover art to Supabase Storage...')
    const coverArtExtension = coverArt.name.split('.').pop()?.toLowerCase() || 'jpg'
    const coverArtPath = `${releaseFolder}/cover.${coverArtExtension}`
    let coverArtUrl = '';
    
    // Set up the upload with proper retry and timeout logic
    try {
      const { data: coverArtData, error: coverArtError } = await Promise.race([
        timeoutPromise,
        supabaseAdmin.storage
          .from('releases')
          .upload(coverArtPath, coverArt, {
            cacheControl: '3600',
            upsert: false,
            duplex: 'half'
          })
      ]) as any;

      if (coverArtError) {
        console.error('❌ Cover art upload failed:', coverArtError)
        return NextResponse.json({ 
          success: false, 
          error: 'Cover art upload failed',
          details: coverArtError.message
        }, { status: 500 })
      }

      // Get public URL for cover art
      const { data: coverArtUrlData } = supabaseAdmin.storage
        .from('releases')
        .getPublicUrl(coverArtPath)
      
      coverArtUrl = coverArtUrlData.publicUrl
      console.log('✅ Cover art uploaded successfully')
    } catch (uploadError: any) {
      console.error('❌ Cover art upload timeout or error:', uploadError)
      return NextResponse.json({ 
        success: false, 
        error: 'Cover art upload failed',
        details: uploadError.message || 'Upload timed out'
      }, { status: 500 })
    }

    // 2. Upload audio tracks to Supabase Storage
    console.log('🎵 Uploading audio tracks to Supabase Storage...')
    const audioUrls: string[] = []
    
    for (let i = 0; i < audioFiles.length; i++) {
      const audioFile = audioFiles[i]
      const trackExtension = audioFile.name.split('.').pop()?.toLowerCase() || 'wav'
      const trackPath = `${releaseFolder}/track_${i + 1}.${trackExtension}`
      
      // Check if file exceeds Supabase free tier size limit (50MB)
      if (audioFile.size > 50 * 1024 * 1024) {
        console.error(`❌ Track ${i + 1} exceeds Supabase size limit: ${audioFile.name} (${(audioFile.size / (1024 * 1024)).toFixed(1)}MB)`)
        return NextResponse.json({ 
          success: false, 
          error: `Track ${i + 1} (${audioFile.name}) exceeds the 50MB Supabase storage limit. Please compress your audio file or use a different format.`,
          details: "FILE_TOO_LARGE"
        }, { status: 413 })
      }
      
      console.log(`🎵 Uploading track ${i + 1}: ${audioFile.name} (${(audioFile.size / (1024 * 1024)).toFixed(1)}MB)`)
      
      try {
        const { data: trackData, error: trackError } = await Promise.race([
          timeoutPromise,
          supabaseAdmin.storage
            .from('releases')
            .upload(trackPath, audioFile, {
              cacheControl: '3600',
              upsert: false,
              duplex: 'half'
            })
        ]) as any;

        if (trackError) {
          console.error(`❌ Track ${i + 1} upload failed:`, trackError)
          return NextResponse.json({ 
            success: false, 
            error: `Track ${i + 1} upload failed`,
            details: trackError.message
          }, { status: 500 })
        }

        // Get public URL for track
        const { data: trackUrlData } = supabaseAdmin.storage
          .from('releases')
          .getPublicUrl(trackPath)
        
        audioUrls.push(trackUrlData.publicUrl)
        console.log(`✅ Track ${i + 1} uploaded successfully`)
      } catch (trackUploadError: any) {
        console.error(`❌ Track ${i + 1} upload timeout or error:`, trackUploadError)
        return NextResponse.json({ 
          success: false, 
          error: `Track ${i + 1} upload failed`,
          details: trackUploadError.message || 'Upload timed out or connection lost'
        }, { status: 500 })
      }
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Files uploaded successfully to Supabase Storage',
      coverArtUrl: coverArtUrl,
      audioUrls: audioUrls,
      storageProvider: 'supabase'
    })
    
  } catch (error: any) {
    console.error('❌ Server error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}
