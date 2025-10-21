import { NextRequest, NextResponse } from 'next/server'
import { musoApi } from '@/lib/muso-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistId = searchParams.get('id')
    const limit = parseInt(searchParams.get('limit') || '10')
    const includeGenres = searchParams.getAll('includeGenres')
    const excludeGenres = searchParams.getAll('excludeGenres')

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
      // Try to fetch from real Muso API first - get collaborators as recommendations
      const collaboratorsResult = await musoApi.getProfileCollaborators(artistId, {
        limit,
        sortKey: 'popularity',
        sortDirection: 'DESC',
        type: 'artist'
      })

      if (collaboratorsResult.items && collaboratorsResult.items.length > 0) {
        return NextResponse.json({
          success: true,
          data: collaboratorsResult.items,
          meta: {
            total: collaboratorsResult.totalCount,
            limit,
            source: 'muso_api',
            generated_at: new Date().toISOString()
          }
        })
      }
    } catch (apiError) {
      console.warn('Muso API unavailable, falling back to mock data:', apiError)
    }

    // Fallback to mock recommendations data
    const mockRecommendations = [
      {
        id: 'rec-1',
        name: 'Phoebe Bridgers',
        type: 'artist' as const,
        avatarUrl: '/placeholder.jpg',
        popularity: 85,
        creditCount: 45,
        collaboratorsCount: 32,
        verifiedArtist: true,
        genres: ['Indie Rock', 'Alternative Rock', 'Indie Folk'],
        labels: ['Dead Oceans'],
        monthlyListeners: 12000000
      },
      {
        id: 'rec-2',
        name: 'Clairo',
        type: 'artist' as const,
        avatarUrl: '/placeholder.jpg',
        popularity: 82,
        creditCount: 28,
        collaboratorsCount: 24,
        verifiedArtist: true,
        genres: ['Indie Pop', 'Bedroom Pop', 'Alternative Rock'],
        labels: ['FADER Label'],
        monthlyListeners: 15000000
      },
      {
        id: 'rec-3',
        name: 'Girl in Red',
        type: 'artist' as const,
        avatarUrl: '/placeholder.jpg',
        popularity: 79,
        creditCount: 22,
        collaboratorsCount: 18,
        verifiedArtist: true,
        genres: ['Indie Pop', 'Alternative Rock'],
        labels: ['AWAL'],
        monthlyListeners: 8000000
      },
      {
        id: 'rec-4',
        name: 'Mitski',
        type: 'artist' as const,
        avatarUrl: '/placeholder.jpg',
        popularity: 87,
        creditCount: 56,
        collaboratorsCount: 41,
        verifiedArtist: true,
        genres: ['Indie Rock', 'Art Rock', 'Alternative Rock'],
        labels: ['Dead Oceans'],
        monthlyListeners: 18000000
      },
      {
        id: 'rec-5',
        name: 'Soccer Mommy',
        type: 'artist' as const,
        avatarUrl: '/placeholder.jpg',
        popularity: 73,
        creditCount: 31,
        collaboratorsCount: 26,
        verifiedArtist: true,
        genres: ['Indie Rock', 'Dream Pop'],
        labels: ['Clean Slate Music'],
        monthlyListeners: 4500000
      }
    ]

    const limited = mockRecommendations.slice(0, limit)

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
    console.error('Recommendations API error:', error)
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
