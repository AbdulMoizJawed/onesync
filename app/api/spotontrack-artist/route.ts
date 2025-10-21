import { NextRequest, NextResponse } from 'next/server'
import { spotontrackApi } from '@/lib/spotontrack-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistName = searchParams.get('name')
    
    if (!artistName) {
      return NextResponse.json(
        { success: false, message: 'Artist name is required' },
        { status: 400 }
      )
    }

    console.log('🎤 Getting enriched SpotOnTrack data for:', artistName)
    
    // Get artist data from SpotOnTrack by searching for tracks
    const tracks = await spotontrackApi.searchTracks(artistName)
    let artistData = null
    if (tracks && tracks.length > 0) {
      // Extract artist info from the first track
      const firstTrack = tracks[0]
      if (firstTrack.artists && firstTrack.artists.length > 0) {
        artistData = firstTrack.artists[0]
      }
    }
    
    if (!artistData) {
      return NextResponse.json(
        { success: false, message: 'Artist not found' },
        { status: 404 }
      )
    }

    // Transform to the expected format
    const enrichedData = {
      artist: {
        id: artistData.id,
        name: artistData.name,
        imageUrl: artistData.image,
        genre: 'Unknown',
        popularity: 0,
        // Mock data for compatibility
        popularityScore: 50,
        verified: false
      },
      metrics: {
        // Mock metrics since our simplified API doesn't provide this data
        streams: 0,
        followers: 0,
        playlists: 0,
        chartPerformance: {},
        marketData: {}
      },
      spotontrack: artistData
    }
    
    console.log('✅ SpotOnTrack enriched data prepared for:', artistName)
    
    return NextResponse.json({
      success: true,
      data: enrichedData
    })
  } catch (error) {
    console.error('SpotOnTrack Artist search error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch artist data from SpotOnTrack',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
