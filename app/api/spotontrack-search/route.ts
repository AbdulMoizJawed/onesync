import { NextRequest, NextResponse } from 'next/server'
import { spotontrackApi } from '@/lib/spotontrack-api'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const term = searchParams.get('q') || searchParams.get('term')
  const type = searchParams.get('type') || 'artist'

  if (!term) {
    return NextResponse.json({ 
      success: false, 
      message: 'Search term is required' 
    }, { status: 400 })
  }

  try {
    console.log('🔍 SpotOnTrack Search API called with:', { term, type })
    let results: any[] = []
    
    if (type === 'artist' || type === 'all') {
      console.log('🎤 Searching for tracks by artist with SpotOnTrack...')
      const tracks = await spotontrackApi.searchTracks(term)
      // Extract unique artists from track results
      const artistMap = new Map()
      tracks.forEach((track: any) => {
        if (track.artists && track.artists.length > 0) {
          track.artists.forEach((artist: any) => {
            if (!artistMap.has(artist.id)) {
              artistMap.set(artist.id, artist)
            }
          })
        }
      })
      const artistResults = Array.from(artistMap.values())
      
      for (const artist of artistResults) {
        console.log('✅ SpotOnTrack artist found:', artist.name)
        
        const transformedArtist = {
          id: artist.id,
          name: artist.name,
          type: 'artist',
          imageUrl: artist.image || '',
          genres: [], // SpotOnTrack doesn't provide genres
          popularityScore: artist.marketData?.popularity || 0,
          followers: artist.followers?.total || 0,
          streams: {
            total: {
              total: artist.streams?.total || 0,
              monthly: artist.streams?.monthly || 0,
              daily: artist.streams?.daily || 0
            }
          },
          marketData: artist.marketData,
          hasSpotonTrackData: true
        }
        
        results.push(transformedArtist)
      }
    }
    
    if (type === 'track' || type === 'all') {
      console.log('🎵 Searching for tracks with SpotOnTrack...')
      const tracks = await spotontrackApi.searchTracks(term)
      const track = tracks && tracks.length > 0 ? tracks[0] : null
      if (track) {
        console.log('✅ SpotOnTrack track found:', track.name)
        
        const transformedTrack = {
          id: track.isrc,
          name: track.name,
          type: 'track',
          imageUrl: track.artwork || '',
          artist: track.artists && track.artists.length > 0 ? track.artists[0].name : '',
          album: '', // Not available in simplified interface
          releaseDate: track.release_date || '',
          genres: [], // Not available in simplified interface
          popularityScore: 0, // Not available in simplified interface
          duration: 0, // Not available in simplified interface
          streams: {
            total: {
              total: 0,
              monthly: 0,
              daily: 0
            }
          },
          marketData: {
            popularity: 0,
            trend: 'stable',
            trendPercentage: 0,
            industry_rank: 0
          },
          hasSpotonTrackData: true
        }
        
        results.push(transformedTrack)
      }
    }

    console.log('📊 Total SpotOnTrack results:', results.length)
    return NextResponse.json({ 
      success: true, 
      results 
    })
  } catch (error) {
    console.error('SpotOnTrack Search API error:', error)
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to perform search',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
