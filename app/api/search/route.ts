import { NextRequest, NextResponse } from 'next/server'
import { spotontrackApi } from '@/lib/spotontrack-api'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const term = searchParams.get('q') || searchParams.get('term') // Accept both 'q' and 'term'
  const type = searchParams.get('type') || 'artist'

  if (!term) {
    return NextResponse.json({ 
      success: false, 
      message: 'Search term is required' 
    }, { status: 400 })
  }

  try {
    console.log('🔍 Search API called with:', { term, type })
    let results: any[] = []

    try {
      if (type === 'artist' || type === 'all') {
        console.log('🎤 Searching SpotOnTrack for tracks by artist...')
        // Get tracks and extract unique artists from them
        const tracks = await spotontrackApi.searchTracks(term)
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
        const artists = Array.from(artistMap.values())
        const transformed = (artists || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          type: 'artist',
          imageUrl: a.image || '',
          genres: [],
          popularityScore: a.marketData?.popularity || 0,
          followers: a.followers?.total || 0,
          hasSpotonTrackData: !!a
        }))
        results.push(...transformed)
      }

      if (type === 'track' || type === 'all') {
        console.log('🎵 Searching SpotOnTrack for tracks...')
        const tracks = await spotontrackApi.searchTracks(term)
        const transformed = (tracks || []).map((t: any) => ({
          id: t.isrc || t.id || t.track_id || t.uid || t.name,
          name: t.name || t.title || '',
          type: 'track',
          imageUrl: t.artwork || '',
          artist: t.artists?.[0]?.name || t.artist || '',
          album: t.album || '',
          releaseDate: t.release_date || '',
          genres: [],
          popularityScore: t.marketData?.popularity || 0,
          duration: t.duration || 0,
          hasSpotonTrackData: true
        }))
        results.push(...transformed)
      }

      console.log('📊 Total results:', results.length)
      return NextResponse.json({ success: true, results })
    } catch (error) {
      console.error('Search API error:', error)
      return NextResponse.json({ success: false, message: 'Failed to perform search', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
    }
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to perform search',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
