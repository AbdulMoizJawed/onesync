import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Fetch releases with cover art URLs
    const { data: releases, error } = await supabase
      .from('releases')
      .select('id, title, artist_name, cover_art_url, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Analyze the cover art URLs
    const analysis = releases.map(release => {
      let storageType = 'unknown'
      if (release.cover_art_url) {
        if (release.cover_art_url.includes('supabase')) {
          storageType = 'supabase'
        } else if (release.cover_art_url.includes('amazonaws.com')) {
          storageType = 's3'
        }
      } else {
        storageType = 'null'
      }
      
      return {
        id: release.id,
        title: release.title,
        artist: release.artist_name,
        coverArtUrl: release.cover_art_url,
        storageType,
        created: new Date(release.created_at).toLocaleDateString()
      }
    })
    
    // Count storage types
    const summary = {
      total: releases.length,
      supabase: analysis.filter(r => r.storageType === 'supabase').length,
      s3: analysis.filter(r => r.storageType === 's3').length,
      null: analysis.filter(r => r.storageType === 'null').length
    }
    
    return NextResponse.json({
      summary,
      releases: analysis
    })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
