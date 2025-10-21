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

    const collabsData = await musoApi.getProfileCollaborators(
      artistId,
      { 
        limit: 10, 
        sortKey: 'collaborationsCount', 
        sortDirection: 'DESC',
        type: 'artist'
      }
    )
    
    return NextResponse.json({
      success: true,
      items: collabsData.items || [],
      total: collabsData.totalCount || 0
    })
  } catch (error: any) {
    console.error('Error fetching MUSO collaborators:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to fetch MUSO collaborators'
    }, { status: 500 })
  }
}
