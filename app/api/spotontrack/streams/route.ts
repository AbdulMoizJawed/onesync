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

    // Streams data not available in simplified API
    const streamsData = {
      success: false,
      message: 'Streams data not available in simplified SpotonTrack API',
      data: []
    }
    
    return NextResponse.json(streamsData || {})
  } catch (error: any) {
    console.error('Error fetching streams data:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to fetch streams data'
    }, { status: 500 })
  }
}
