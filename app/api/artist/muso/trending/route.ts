import { NextRequest, NextResponse } from 'next/server'
import { musoApi, MusoProfile } from '@/lib/muso-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '12')
    const genre = searchParams.get('genre') || undefined
    const country = searchParams.get('country') || undefined
    const timeframe = (searchParams.get('timeframe') as 'daily' | 'weekly' | 'monthly') || 'weekly'

    try {
      // Try to fetch from real Muso API first - search for popular profiles
      const result = await musoApi.search({
        keyword: genre || 'popular',
        type: ['profile'],
        limit,
        offset: 0
      })

      if (result.profiles && result.profiles.items && result.profiles.items.length > 0) {
        return NextResponse.json({
          success: true,
          data: result.profiles.items,
          meta: {
            total: result.profiles.total,
            limit,
            source: 'muso_api',
            generated_at: new Date().toISOString()
          }
        })
      }
    } catch (apiError) {
      console.warn('Muso API unavailable, falling back to mock data:', apiError)
    }

    // Fallback to mock trending artists data
    const trendingArtists: MusoProfile[] = [
      {
        id: 'trend-1',
        name: 'Billie Eilish',
        type: 'artist',
        bio: 'Grammy-winning pop sensation',
        avatarUrl: '/placeholder.jpg',
        popularity: 98,
        creditCount: 42,
        collaboratorsCount: 28,
        verifiedArtist: true,
        genres: ['Pop', 'Alternative', 'Indie'],
        labels: ['Interscope Records'],
        monthlyListeners: 85000000,
        totalStreams: 12000000000,
        activeYears: { start: 2015 },
        instagram: 'billieeilish',
        twitter: 'billieeilish',
        youtube: 'billieeilish'
      },
      {
        id: 'trend-2',
        name: 'Bad Bunny',
        type: 'artist',
        bio: 'Latin trap and reggaeton superstar',
        avatarUrl: '/placeholder.jpg',
        popularity: 96,
        creditCount: 78,
        collaboratorsCount: 45,
        verifiedArtist: true,
        genres: ['Reggaeton', 'Latin Trap', 'Latin Urban'],
        labels: ['Rimas Entertainment'],
        monthlyListeners: 75000000,
        totalStreams: 15000000000,
        activeYears: { start: 2016 },
        instagram: 'badbunnypr',
        twitter: 'sanbenito',
        youtube: 'BadBunnyTV'
      },
      {
        id: 'trend-3',
        name: 'Dua Lipa',
        type: 'artist',
        bio: 'British pop sensation',
        avatarUrl: '/placeholder.jpg',
        popularity: 94,
        creditCount: 35,
        collaboratorsCount: 32,
        verifiedArtist: true,
        genres: ['Pop', 'Dance-Pop', 'Disco'],
        labels: ['Warner Records'],
        monthlyListeners: 70000000,
        totalStreams: 10000000000,
        activeYears: { start: 2015 },
        instagram: 'dualipa',
        twitter: 'DUALIPA'
      },
      {
        id: 'trend-4',
        name: 'The Weeknd',
        type: 'artist',
        bio: 'R&B and pop innovator',
        avatarUrl: '/placeholder.jpg',
        popularity: 95,
        creditCount: 68,
        collaboratorsCount: 51,
        verifiedArtist: true,
        genres: ['R&B', 'Pop', 'Alternative R&B'],
        labels: ['XO', 'Republic Records'],
        monthlyListeners: 78000000,
        totalStreams: 18000000000,
        activeYears: { start: 2010 },
        instagram: 'theweeknd',
        twitter: 'theweeknd'
      },
      {
        id: 'trend-5',
        name: 'Olivia Rodrigo',
        type: 'artist',
        bio: 'Pop-punk princess and songwriter',
        avatarUrl: '/placeholder.jpg',
        popularity: 92,
        creditCount: 28,
        collaboratorsCount: 18,
        verifiedArtist: true,
        genres: ['Pop', 'Pop Rock', 'Alternative Rock'],
        labels: ['Geffen Records'],
        monthlyListeners: 55000000,
        totalStreams: 8000000000,
        activeYears: { start: 2020 },
        instagram: 'oliviarodrigo',
        twitter: 'oliviarodrigo'
      },
      {
        id: 'trend-6',
        name: 'Harry Styles',
        type: 'artist',
        bio: 'Solo artist and former One Direction member',
        avatarUrl: '/placeholder.jpg',
        popularity: 93,
        creditCount: 45,
        collaboratorsCount: 38,
        verifiedArtist: true,
        genres: ['Pop', 'Rock', 'Folk'],
        labels: ['Columbia Records'],
        monthlyListeners: 68000000,
        totalStreams: 14000000000,
        activeYears: { start: 2010 },
        instagram: 'harrystyles',
        twitter: 'Harry_Styles'
      }
    ]

    // Shuffle and limit results
    const shuffled = trendingArtists.sort(() => 0.5 - Math.random())
    const limited = shuffled.slice(0, limit)

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
    console.error('Trending artists API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch trending artists',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
