import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test direct Spotify API call
    const { envConfig } = await import('@/lib/env-config')
    console.log('Testing Spotify API with credentials:', {
      clientId: envConfig.spotifyClientId.substring(0, 10) + '...',
      hasSecret: !!envConfig.spotifyClientSecret
    })

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${envConfig.spotifyClientId}:${envConfig.spotifyClientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    })

    const tokenData = await response.json()
    console.log('Token response:', { status: response.status, hasToken: !!tokenData.access_token })

    if (tokenData.access_token) {
      // Test search
      const searchResponse = await fetch('https://api.spotify.com/v1/search?q=taylor swift&type=artist&limit=1', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      })

      const searchData = await searchResponse.json()
      console.log('Search response:', { status: searchResponse.status, hasResults: !!(searchData.artists?.items?.length) })

      return NextResponse.json({
        success: true,
        tokenTest: { status: response.status, hasToken: !!tokenData.access_token },
        searchTest: { status: searchResponse.status, hasResults: !!(searchData.artists?.items?.length) },
        sampleResult: searchData.artists?.items?.[0]?.name || 'No results'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to get token',
        details: tokenData
      })
    }
  } catch (error) {
    console.error('Spotify test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
