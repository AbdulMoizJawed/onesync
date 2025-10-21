import { NextResponse } from "next/server"
import { spotontrackApi } from "@/lib/spotontrack-api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const trackId = searchParams.get('trackId')
    
    if (!trackId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Track ID is required' 
      }, { status: 400 })
    }

    // Playlists data not available in simplified API
    const playlistsData = {
      success: false,
      message: 'Playlists data not available in simplified SpotonTrack API',
      data: []
    }
    
    return NextResponse.json(playlistsData || {})
  } catch (error: any) {
    console.error('Error fetching playlists data:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to fetch playlists data'
    }, { status: 500 })
  }
}
