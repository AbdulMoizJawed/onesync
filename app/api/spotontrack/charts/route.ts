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

    // Charts data not available in simplified API
    const chartsData = {
      success: false,
      message: 'Charts data not available in simplified SpotonTrack API',
      data: []
    }
    
    return NextResponse.json(chartsData || {})
  } catch (error: any) {
    console.error('Error fetching charts data:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to fetch charts data'
    }, { status: 500 })
  }
}
