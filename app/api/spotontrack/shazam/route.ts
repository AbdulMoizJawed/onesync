import { NextResponse } from "next/server"
import { spotontrackApi } from "@/lib/spotontrack-api"

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

    // Get Shazam data for the track
    const shazamData = await spotontrackApi.getShazamData(trackId)
    
    return NextResponse.json({
      success: true,
      data: shazamData || [],
      meta: {
        track_id: trackId,
        data_points: shazamData?.length || 0,
        source: 'spotontrack'
      }
    })
  } catch (error: any) {
    console.error('Error fetching Shazam data:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to fetch Shazam data'
    }, { status: 500 })
  }
}
