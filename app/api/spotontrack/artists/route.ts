import { NextRequest, NextResponse } from 'next/server'
import { spotontrackApi } from '@/lib/spotontrack-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistName = searchParams.get('name')
    const artistId = searchParams.get('id')
    
    if (!artistName && !artistId) {
      return NextResponse.json(
        { success: false, message: 'Artist name or ID is required' },
        { status: 400 }
      )
    }

    console.log('🎯 SpotOnTrack: Fetching artist data for:', artistName || artistId)

    let artistData = null

    if (artistName) {
      // Search for tracks by this artist
      const tracks = await spotontrackApi.searchTracks(artistName)
      if (tracks && tracks.length > 0) {
        // Create artist data from tracks
        const firstTrack = tracks[0]
        const artist = firstTrack.artists?.[0]
        
        if (artist) {
          artistData = {
            id: artist.id,
            name: artist.name,
            image: artist.image,
            tracks: tracks.slice(0, 10), // First 10 tracks
            streams: {
              total: 0, // Not available from tracks
              monthly: 0,
              daily: 0
            }
          }
        }
      }
    }

    if (!artistData) {
      return NextResponse.json({
        success: false,
        message: 'Artist not found in SpotOnTrack database',
        data: null
      })
    }

    console.log('✅ SpotOnTrack: Artist data retrieved successfully')

    // Also get health check status
    const isHealthy = await spotontrackApi.healthCheck()

    return NextResponse.json({
      success: true,
      data: artistData,
      source: 'spotontrack',
      meta: {
        api_healthy: isHealthy,
        has_real_data: artistData.tracks && artistData.tracks.length > 0
      }
    })
  } catch (error) {
    console.error('SpotOnTrack artist fetch error:', error)
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
