import { NextRequest, NextResponse } from 'next/server'
import { spotontrackApi } from '@/lib/spotontrack-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistName = searchParams.get('name')
    
    if (!artistName) {
      return NextResponse.json(
        { success: false, message: 'Artist name is required' },
        { status: 400 }
      )
    }

    // Use SpotOnTrack to search for tracks by this artist
    const searchResults = await spotontrackApi.searchTracks(artistName)
    
    // Extract artist info from the first track result
    let data = null
    if (searchResults && searchResults.length > 0) {
      const firstTrack = searchResults[0]
      const mainArtist = firstTrack.artists && firstTrack.artists.length > 0 ? firstTrack.artists[0] : null
      
      if (mainArtist) {
        data = {
          id: mainArtist.id,
          name: mainArtist.name,
          image: mainArtist.image,
          tracks: searchResults.map(track => ({
            isrc: track.isrc,
            name: track.name,
            release_date: track.release_date,
            artwork: track.artwork
          }))
        }
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Artist search error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch artist data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
