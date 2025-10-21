import { NextRequest, NextResponse } from 'next/server'
import { musicAPIClient } from '@/lib/music-apis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Testing API configuration and authentication...')
    
    // Test authentication
    const token = await musicAPIClient.getSpotifyAccessToken()
    console.log('✅ Token obtained successfully')
    
    // Test artist search
    const result = await musicAPIClient.searchArtist('Taylor Swift')
    
    const testResults = {
      authentication: 'SUCCESS',
      tokenReceived: !!token,
      artistSearchWorking: !!result,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'NO TOKEN',
      searchResult: result ? {
        name: result.name,
        followers: result.followers,
        hasSpotifyUrl: !!result.spotifyUrl,
        genreCount: result.genres?.length || 0
      } : null,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      status: 'API_CONFIGURATION_WORKING',
      results: testResults
    })

  } catch (error) {
    console.error('❌ API test failed:', error)
    
    return NextResponse.json({
      success: false,
      status: 'API_CONFIGURATION_FAILED',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
