import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    console.log('🔍 Analyzing releases and cover art URLs...')
    
    // Fetch all releases with their cover art URLs
    const { data: releases, error } = await supabase
      .from('releases')
      .select('id, title, artist_name, cover_art_url, audio_url, created_at')
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Categorize releases by storage type
    const supabaseReleases = releases.filter(r => 
      r.cover_art_url?.includes('supabase.co') || 
      r.audio_url?.includes('supabase.co')
    )
    
    const s3Releases = releases.filter(r => 
      r.cover_art_url?.includes('amazonaws.com') || 
      r.audio_url?.includes('amazonaws.com')
    )
    
    const nullReleases = releases.filter(r => 
      !r.cover_art_url || !r.audio_url
    )
    
    const analysis = {
      total: releases.length,
      breakdown: {
        supabase: supabaseReleases.length,
        s3: s3Releases.length, 
        incomplete: nullReleases.length
      },
      supabaseReleases: supabaseReleases.map(r => ({
        id: r.id,
        title: r.title,
        artist: r.artist_name,
        coverArtUrl: r.cover_art_url,
        audioUrl: r.audio_url,
        created: new Date(r.created_at).toLocaleDateString()
      })),
      s3Releases: s3Releases.map(r => ({
        id: r.id,
        title: r.title,
        artist: r.artist_name,
        coverArtUrl: r.cover_art_url,
        audioUrl: r.audio_url,
        created: new Date(r.created_at).toLocaleDateString()
      }))
    }
    
    return NextResponse.json(analysis)
    
  } catch (error: any) {
    console.error('❌ Analysis failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const confirmDelete = searchParams.get('confirm')
    
    if (confirmDelete !== 'YES_DELETE_SUPABASE_RELEASES') {
      return NextResponse.json({ 
        error: 'Confirmation required. Add ?confirm=YES_DELETE_SUPABASE_RELEASES to proceed.' 
      }, { status: 400 })
    }
    
    // Create Supabase admin client  
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    console.log('🗑️ Deleting releases with Supabase URLs...')
    
    // Find releases with Supabase URLs
    const { data: supabaseReleases, error: fetchError } = await supabase
      .from('releases')
      .select('id, title, cover_art_url, audio_url')
      .or('cover_art_url.ilike.%supabase.co%,audio_url.ilike.%supabase.co%')
    
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }
    
    if (supabaseReleases.length === 0) {
      return NextResponse.json({ 
        message: 'No releases with Supabase URLs found.',
        deleted: 0
      })
    }
    
    console.log(`Found ${supabaseReleases.length} releases with Supabase URLs`)
    
    // Delete the releases
    const { error: deleteError } = await supabase
      .from('releases')
      .delete()
      .or('cover_art_url.ilike.%supabase.co%,audio_url.ilike.%supabase.co%')
    
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }
    
    console.log(`✅ Successfully deleted ${supabaseReleases.length} releases with Supabase URLs`)
    
    return NextResponse.json({
      message: `Successfully deleted ${supabaseReleases.length} releases with Supabase URLs`,
      deleted: supabaseReleases.length,
      deletedReleases: supabaseReleases.map(r => ({
        id: r.id,
        title: r.title
      }))
    })
    
  } catch (error: any) {
    console.error('❌ Deletion failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
