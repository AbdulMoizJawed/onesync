import { NextRequest, NextResponse } from 'next/server'
import { combinedMusicApi } from '@/lib/combined-music-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = (searchParams.get('timeframe') as 'daily' | 'weekly' | 'monthly') || 'weekly'
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const trendingData = await combinedMusicApi.getTrendingArtists(timeframe, limit)
    
    return NextResponse.json({
      success: true,
      data: {
        timeframe,
        artists: trendingData
      }
    })
  } catch (error) {
    console.error('Trending artists error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch trending artists',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
