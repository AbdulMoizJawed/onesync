import { NextRequest, NextResponse } from 'next/server'
import { musicAPIClient } from '@/lib/music-apis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistName = searchParams.get('name')

    if (!artistName || artistName.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Artist name is required' 
        },
        { status: 400 }
      )
    }

    console.log(`Searching for artist: ${artistName}`)

    // Search for the artist on Spotify
    const result = await musicAPIClient.searchArtist(artistName.trim())

    if (!result) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Artist not found or API configuration issue',
          artist: null
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      artist: result,
      error: null
    })

  } catch (error) {
    console.error('Artist search error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    
    // Check for specific API errors
    if (message.includes('401') || message.includes('authentication')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'API authentication failed. Please check configuration.',
          artist: null
        },
        { status: 500 }
      )
    }
    
    if (message.includes('credentials not configured')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'API credentials not configured properly',
          artist: null
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: message,
        artist: null
      },
      { status: 500 }
    )
  }
}
