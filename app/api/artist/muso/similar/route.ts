import { NextRequest, NextResponse } from 'next/server'
import { musoApi } from '@/lib/muso-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistId = searchParams.get('id')
    const limit = parseInt(searchParams.get('limit') || '10')
    const minSimilarity = parseFloat(searchParams.get('minSimilarity') || '0.7')
    const includeCollaborators = searchParams.get('includeCollaborators') === 'true'

    if (!artistId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Artist ID is required',
        },
        { status: 400 }
      )
    }

    try {
      // Try to fetch from real Muso API first - get collaborators as similar artists
      const result = await musoApi.getProfileCollaborators(artistId, {
        limit,
        sortKey: 'collaborationsCount',
        sortDirection: 'DESC',
        type: 'artist'
      })

      if (result.items && result.items.length > 0) {
        return NextResponse.json({
          success: true,
          data: result.items,
          meta: {
            total: result.totalCount,
            limit,
            source: 'muso_api',
            generated_at: new Date().toISOString()
          }
        })
      }
    } catch (apiError) {
      console.warn('Muso API unavailable, falling back to mock data:', apiError)
    }

    // Fallback to mock similar artists data
    const mockSimilarArtists = [
      {
        id: 'similar-1',
        name: 'Taylor Swift',
        type: 'artist' as const,
        avatarUrl: '/placeholder.jpg',
        popularity: 97,
        creditCount: 156,
        collaboratorsCount: 89,
        verifiedArtist: true,
        genres: ['Pop', 'Country', 'Folk'],
        labels: ['Republic Records'],
        monthlyListeners: 82000000,
        similarity: 0.89
      },
      {
        id: 'similar-2',
        name: 'Ariana Grande',
        type: 'artist' as const,
        avatarUrl: '/placeholder.jpg',
        popularity: 94,
        creditCount: 89,
        collaboratorsCount: 67,
        verifiedArtist: true,
        genres: ['Pop', 'R&B'],
        labels: ['Republic Records'],
        monthlyListeners: 68000000,
        similarity: 0.85
      },
      {
        id: 'similar-3',
        name: 'Lorde',
        type: 'artist' as const,
        avatarUrl: '/placeholder.jpg',
        popularity: 88,
        creditCount: 34,
        collaboratorsCount: 28,
        verifiedArtist: true,
        genres: ['Alternative Pop', 'Indie Pop'],
        labels: ['Universal Music Group'],
        monthlyListeners: 32000000,
        similarity: 0.82
      },
      {
        id: 'similar-4',
        name: 'Lana Del Rey',
        type: 'artist' as const,
        avatarUrl: '/placeholder.jpg',
        popularity: 90,
        creditCount: 67,
        collaboratorsCount: 45,
        verifiedArtist: true,
        genres: ['Alternative Pop', 'Dream Pop'],
        labels: ['Interscope Records'],
        monthlyListeners: 45000000,
        similarity: 0.78
      }
    ]

    const limited = mockSimilarArtists.slice(0, limit)

    return NextResponse.json({
      success: true,
      data: limited,
      meta: {
        total: limited.length,
        limit,
        source: 'mock_data',
        generated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Similar artists API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
