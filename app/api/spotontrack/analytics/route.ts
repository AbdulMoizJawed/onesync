import { NextResponse } from "next/server"
import { spotontrackApi } from "@/lib/spotontrack-api"

/**
 * Get comprehensive analytics for a track across all platforms
 * This endpoint combines data from multiple SpotOnTrack API endpoints:
 * - Spotify, Apple, Deezer charts
 * - Spotify, Apple, Deezer playlists
 * - Shazam data and charts
 * - Spotify streams
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const trackId = searchParams.get('trackId') || searchParams.get('isrc')
    
    if (!trackId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Track ID (ISRC) is required' 
      }, { status: 400 })
    }

    // Get comprehensive track analytics from all sources
    const analyticsData = await spotontrackApi.getTrackAnalytics(trackId)
    
    if (!analyticsData) {
      return NextResponse.json({
        success: false,
        message: 'Track not found or no data available'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: analyticsData,
      meta: {
        track_id: trackId,
        track_name: analyticsData.name,
        artist: analyticsData.artist,
        platforms: {
          spotify: {
            charts: analyticsData.spotify_charts?.length || 0,
            playlists: analyticsData.spotify_playlists?.length || 0,
            streams: analyticsData.spotify_streams?.length || 0
          },
          apple: {
            charts: analyticsData.apple_charts?.length || 0,
            playlists: analyticsData.apple_playlists?.length || 0
          },
          deezer: {
            charts: analyticsData.deezer_charts?.length || 0,
            playlists: analyticsData.deezer_playlists?.length || 0
          },
          shazam: {
            charts: analyticsData.shazam_charts?.length || 0,
            data_points: analyticsData.shazam_data?.length || 0
          }
        },
        source: 'spotontrack'
      }
    })
  } catch (error: any) {
    console.error('Error fetching comprehensive analytics:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to fetch comprehensive analytics'
    }, { status: 500 })
  }
}
