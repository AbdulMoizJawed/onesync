import { NextRequest, NextResponse } from 'next/server'
import { spotontrackApi } from '@/lib/spotontrack-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trackTitle = searchParams.get('title')
    const artistName = searchParams.get('artist')
    const trackId = searchParams.get('id')
    
    if (!trackTitle && !trackId) {
      return NextResponse.json(
        { success: false, message: 'Track title or ID is required' },
        { status: 400 }
      )
    }

    console.log('🎯 SpotOnTrack: Fetching track data for:', { trackTitle, artistName, trackId })

    let trackData = null

    if (trackId) {
      // Get track by ID
      trackData = await spotontrackApi.getTrackDetails(trackId)
    } else if (trackTitle) {
      // Search for track
      trackData = await spotontrackApi.searchTrack(trackTitle, artistName || undefined)
    }

    if (!trackData) {
      return NextResponse.json({
        success: false,
        message: 'Track not found in SpotOnTrack database',
        data: null
      })
    }

    console.log('✅ SpotOnTrack: Track data retrieved successfully')

    return NextResponse.json({
      success: true,
      data: trackData,
      source: 'spotontrack'
    })
  } catch (error) {
    console.error('SpotOnTrack track fetch error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch track data from SpotOnTrack',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tracks } = body
    
    if (!tracks || !Array.isArray(tracks)) {
      return NextResponse.json(
        { success: false, message: 'Tracks array is required' },
        { status: 400 }
      )
    }

    console.log('🎯 SpotOnTrack: Fetching data for multiple tracks:', tracks.length)

    // Fetch SpotOnTrack data for multiple tracks
    const trackDataPromises = tracks.map(async (track: { title: string, artist?: string }) => {
      try {
        const data = await spotontrackApi.searchTrack(track.title, track.artist)
        return {
          query: track,
          data,
          found: !!data
        }
      } catch (error) {
        console.error(`Error fetching track "${track.title}":`, error)
        return {
          query: track,
          data: null,
          found: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    const results = await Promise.all(trackDataPromises)
    const foundCount = results.filter(r => r.found).length

    console.log(`✅ SpotOnTrack: Retrieved data for ${foundCount}/${tracks.length} tracks`)

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        total_requested: tracks.length,
        found: foundCount,
        not_found: tracks.length - foundCount
      },
      source: 'spotontrack'
    })
  } catch (error) {
    console.error('SpotOnTrack batch track fetch error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch batch track data from SpotOnTrack',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
