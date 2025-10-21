import { NextResponse } from "next/server"
import { musoApi } from "@/lib/muso-api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query) {
      return NextResponse.json({ 
        success: false, 
        message: 'Search query is required' 
      }, { status: 400 })
    }

    const searchResults = await musoApi.search({
      keyword: query,
      type: ['profile'],
      limit: 5
    })
    
    // Extract profiles from the search results
    const profiles = searchResults.profiles?.items || []
    
    return NextResponse.json({
      success: true,
      results: profiles.map(profile => ({
        id: profile.id,
        name: profile.name,
        type: profile.type,
        avatarUrl: profile.avatarUrl,
        popularity: profile.popularity
      }))
    })
  } catch (error: any) {
    console.error('Error searching MUSO data:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to search MUSO data'
    }, { status: 500 })
  }
}
