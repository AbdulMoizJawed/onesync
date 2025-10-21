import { NextRequest, NextResponse } from 'next/server'
import { combinedMusicApi } from '@/lib/combined-music-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trackTitle = searchParams.get('title')
    const artistName = searchParams.get('artist')
    const trackId = searchParams.get('trackId')
    
    if (!trackTitle) {
      return NextResponse.json(
        { success: false, message: 'Track title is required' },
        { status: 400 }
      )
    }

    const enrichedData = await combinedMusicApi.getEnrichedTrackData(trackTitle, artistName || undefined, trackId || undefined)
    
    return NextResponse.json({
      success: true,
      data: enrichedData
    })
  } catch (error) {
    console.error('Track search error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch track data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
