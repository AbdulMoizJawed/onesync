import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    console.log('🔧 Setting up storage bucket...')

    // Create the releases bucket
    const { data, error } = await supabase.storage.createBucket('releases', {
      public: true,
      fileSizeLimit: 104857600, // 100MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png', 
        'image/webp',
        'audio/mpeg',
        'audio/wav',
        'audio/flac',
        'audio/aiff',
        'audio/mp4',
        'audio/x-m4a'
      ]
    })

    if (error && !error.message.includes('already exists')) {
      console.error('❌ Failed to create bucket:', error)
      return NextResponse.json(
        { error: `Failed to create storage bucket: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Storage bucket setup completed')

    return NextResponse.json({ 
      success: true, 
      message: 'Storage bucket setup completed',
      bucketExists: error?.message.includes('already exists') || false
    })

  } catch (error: any) {
    console.error('❌ Setup error:', error)
    return NextResponse.json(
      { error: `Setup failed: ${error.message}` },
      { status: 500 }
    )
  }
}
