import { NextRequest, NextResponse } from 'next/server'
import { envConfig } from '@/lib/env-config'
import { spotontrackApi } from '@/lib/spotontrack-api'

interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ name: string }>
  album: {
    name: string
    images: Array<{ url: string }>
  }
  duration_ms: number
  popularity: number
  preview_url?: string
  external_urls: {
    spotify: string
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistName = searchParams.get('name')
    const source = searchParams.get('source') || 'combined' // 'spotify', 'spotontrack', or 'combined'
    
    if (!artistName) {
      return NextResponse.json(
        { success: false, message: 'Artist name is required' },
        { status: 400 }
      )
    }

    console.log('🎵 Fetching tracks for artist:', artistName, 'from source:', source)

    let spotifyTracks: SpotifyTrack[] = []
    let spotontrackData: any = null

    // Get SpotOnTrack data if requested
    if (source === 'spotontrack' || source === 'combined') {
      try {
        console.log('🎯 Fetching SpotOnTrack tracks data...')
        const trackResults = await spotontrackApi.searchTracks(artistName)
        spotontrackData = trackResults
        console.log('🎯 SpotOnTrack data received:', spotontrackData ? `${trackResults.length} tracks` : 'No')
      } catch (error) {
        console.error('❌ SpotOnTrack API error:', error)
      }
    }

    // Get Spotify tracks if requested
    if (source === 'spotify' || source === 'combined') {
      try {
        console.log('🎵 Fetching Spotify tracks...')
        const token = await getSpotifyToken()
        
        // Search for tracks by the artist
        const response = await fetch(`https://api.spotify.com/v1/search?q=artist:"${encodeURIComponent(artistName)}"&type=track&limit=20&market=US`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          spotifyTracks = data.tracks?.items || []
          console.log('✅ Found Spotify tracks:', spotifyTracks.length)
        } else {
          console.error('❌ Spotify API error:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('❌ Spotify API error:', error)
      }
    }

    // Enhance Spotify tracks with SpotOnTrack data when available
    const enhancedTracks = await Promise.all(
      spotifyTracks.map(async (track: SpotifyTrack) => {
        let spotontrackTrackData = null
        
        if (spotontrackData && source === 'combined') {
          try {
            // Try to get detailed track data from SpotOnTrack
            spotontrackTrackData = await spotontrackApi.searchTracks(`${track.name} ${track.artists[0]?.name || ''}`)
          } catch (error) {
            console.error('Error fetching SpotOnTrack track data:', error)
          }
        }

        return {
          ...track,
          spotontrack_data: spotontrackTrackData,
          enhanced: !!spotontrackTrackData
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: enhancedTracks,
      artist_data: spotontrackData,
      source,
      meta: {
        spotify_tracks_count: spotifyTracks.length,
        spotontrack_artist_data: !!spotontrackData,
        enhanced_tracks_count: enhancedTracks.filter(t => t.enhanced).length
      }
    })
  } catch (error) {
    console.error('Artist tracks fetch error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch artist tracks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to get Spotify token
async function getSpotifyToken(): Promise<string> {
  const clientId = envConfig.spotifyClientId
  const clientSecret = envConfig.spotifyClientSecret
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })
  
  const data = await response.json()
  return data.access_token
}
