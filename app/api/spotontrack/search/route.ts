import { NextResponse } from "next/server"
import { spotontrackApi, SpotOnTrackSearchResult } from "@/lib/spotontrack-api"

/**
 * Search for tracks on SpotOnTrack
 * This endpoint allows searching for tracks by name, artist, or ISRC
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'track' // track, artist, isrc 
    const limit = parseInt(searchParams.get('limit') || '10')
    
    if (!query) {
      return NextResponse.json({ 
        success: false, 
        message: 'Search query is required' 
      }, { status: 400 })
    }

    // The current API client only supports track search without type parameter
    let searchResults: any[] = [];
    
    if (type === 'artist') {
      // Use artist-specific search if available
      try {
        searchResults = await spotontrackApi.searchArtist(query, limit);
      } catch (err) {
        console.warn('Artist search failed, falling back to track search:', err);
        searchResults = await spotontrackApi.searchTracks(query);
      }
    } else {
      // Default to track search
      searchResults = await spotontrackApi.searchTracks(query);
    }
    
    // Limit results if needed
    const limitedResults = limit && searchResults.length > limit 
      ? searchResults.slice(0, limit) 
      : searchResults;
    
    return NextResponse.json({
      success: true,
      data: limitedResults || [],
      meta: {
        query,
        type,
        limit,
        total: searchResults.length,
        returned: limitedResults.length,
        source: 'spotontrack'
      }
    })
  } catch (error: any) {
    console.error('Error searching tracks:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to search tracks'
    }, { status: 500 })
  }
}
