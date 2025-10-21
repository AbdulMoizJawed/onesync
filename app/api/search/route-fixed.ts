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
    console.log('Search API called with:', { term, type })
    let results: any[] = []

    if (type === 'artist' || type === 'all') {
      console.log('Searching SpotOnTrack for tracks by artist...')
      const tracks = await spotontrackApi.searchTracks(term)
      // Transform track results to artist format by extracting unique artists
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
      const transformedArtists = Array.from(artistMap.values()).map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        type: 'artist',
        imageUrl: artist.image || '',
        genres: [],
        popularityScore: artist.marketData?.popularity || 0,
        followers: artist.followers?.total || 0,
        hasSpotonTrackData: true
      }))
      results.push(...transformedArtists)
    }

    if (type === 'track' || type === 'all') {
      console.log('Searching SpotOnTrack for tracks...')
      const tracks = await spotontrackApi.searchTracks(term)
      const transformedTracks = (tracks || []).map((track: any) => ({
        id: track.isrc || track.id || track.track_id || track.uid || track.name,
        name: track.name || track.title || '',
        type: 'track',
        imageUrl: track.artwork || '',
        artist: track.artists?.[0]?.name || track.artist || '',
        album: track.album || '',
        releaseDate: track.release_date || '',
        genres: [],
        popularityScore: track.marketData?.popularity || 0,
        duration: track.duration || 0,
        hasSpotonTrackData: true
      }))
      results.push(...transformedTracks)
    }

    console.log('Total results:', results.length)
    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to perform search',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
