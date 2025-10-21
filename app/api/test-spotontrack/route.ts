import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const artist = searchParams.get('artist') || 'Taylor Swift'
    
    console.log('🎯 Testing SpotonTrack API for artist:', artist)
    
    // Import and test SpotonTrack API
    const { spotontrackApi } = await import('@/lib/spotontrack-api')
    
    console.log('📡 Calling SpotonTrack searchArtist...')
    const result = await spotontrackApi.searchArtist(artist)
    
    if (result && result.length > 0) {
      console.log('✅ SpotonTrack data received:', {
        count: result.length,
        firstArtist: result[0]?.name
      })
      
      return NextResponse.json({
        success: true,
        artist: result[0]?.name,
        count: result.length,
        data: result
      })
    } else {
      console.log('❌ No SpotonTrack data found')
      return NextResponse.json({
        success: false,
        message: 'No SpotonTrack data found for artist',
        artist
      })
    }
  } catch (error) {
    console.error('❌ SpotonTrack test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Check server logs for more information'
    })
  }
}
