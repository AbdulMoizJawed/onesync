import { NextResponse } from "next/server"
import { musoApi } from "@/lib/muso-api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const artistId = searchParams.get('artistId')
    
    if (!artistId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Artist ID is required' 
      }, { status: 400 })
    }

    const creditsData = await musoApi.getProfileCredits(
      artistId,
      { 
        limit: 10, 
        sortKey: 'releaseDate', 
        sortDirection: 'DESC' 
      }
    )
    
    return NextResponse.json({
      success: true,
      items: creditsData.items || [],
      total: creditsData.totalCount || 0
    })
  } catch (error: any) {
    console.error('Error fetching MUSO credits:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to fetch MUSO credits'
    }, { status: 500 })
  }
}
