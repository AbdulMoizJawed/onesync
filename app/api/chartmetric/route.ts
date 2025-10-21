import { NextRequest, NextResponse } from 'next/server'
import ChartmetricAPI from '@/lib/chartmetric-api'

// You'll need to add these to your .env.local file
const CHARTMETRIC_REFRESH_TOKEN = process.env.CHARTMETRIC_REFRESH_TOKEN

if (!CHARTMETRIC_REFRESH_TOKEN) {
  console.warn('CHARTMETRIC_REFRESH_TOKEN not found in environment variables. Set this to enable Chartmetric API functionality.')
}

function getChartmetricAPI() {
  if (!CHARTMETRIC_REFRESH_TOKEN) {
    throw new Error('Chartmetric refresh token is required. Set CHARTMETRIC_REFRESH_TOKEN environment variable.')
  }
  return new ChartmetricAPI({
    refreshToken: CHARTMETRIC_REFRESH_TOKEN,
  })
}

export async function GET(request: NextRequest) {
  try {
    if (!CHARTMETRIC_REFRESH_TOKEN) {
      return NextResponse.json({ 
        error: 'Chartmetric API is not configured. Please set CHARTMETRIC_REFRESH_TOKEN environment variable.' 
      }, { status: 503 })
    }

    const chartmetric = getChartmetricAPI()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (!action) {
      return NextResponse.json({ error: 'Action parameter required' }, { status: 400 })
    }

    switch (action) {
      case 'search': {
        const q = searchParams.get('q')
        if (!q) {
          return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
        }

        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
        const type = searchParams.get('type') as any || 'all'
        const beta = searchParams.get('beta') === 'true'

        const results = await chartmetric.search({
          q,
          limit,
          offset,
          type,
          beta,
        })

        return NextResponse.json(results)
      }

      case 'track': {
        const trackId = searchParams.get('trackId')
        if (!trackId) {
          return NextResponse.json({ error: 'Track ID required' }, { status: 400 })
        }

        const track = await chartmetric.getTrack(parseInt(trackId))
        return NextResponse.json(track)
      }

      case 'track-charts': {
        const trackId = searchParams.get('trackId')
        const chartType = searchParams.get('chartType')
        const since = searchParams.get('since')
        
        if (!trackId || !chartType || !since) {
          return NextResponse.json({ 
            error: 'Track ID, chart type, and since date required' 
          }, { status: 400 })
        }

        const until = searchParams.get('until')
        const charts = await chartmetric.getTrackCharts({
          trackId: parseInt(trackId),
          type: chartType as any,
          since,
          until: until || undefined,
        })

        return NextResponse.json(charts)
      }

      case 'track-ids': {
        const type = searchParams.get('type')
        const id = searchParams.get('id')
        
        if (!type || !id) {
          return NextResponse.json({ error: 'Type and ID required' }, { status: 400 })
        }

        const ids = await chartmetric.getTrackIds({
          type: type as any,
          id,
        })

        return NextResponse.json(ids)
      }

      case 'social-search': {
        const url = searchParams.get('url')
        if (!url) {
          return NextResponse.json({ error: 'URL parameter required' }, { status: 400 })
        }

        const type = searchParams.get('type') as any || 'all'
        const results = await chartmetric.socialSearch({ url, type })
        return NextResponse.json(results)
      }

      case 'cities': {
        const countryCode = searchParams.get('countryCode')
        if (!countryCode) {
          return NextResponse.json({ error: 'Country code required' }, { status: 400 })
        }

        const cities = await chartmetric.getCities(countryCode)
        return NextResponse.json(cities)
      }

      case 'genres': {
        const name = searchParams.get('name')
        const genres = await chartmetric.getGenres(name || undefined)
        return NextResponse.json(genres)
      }

      case 'genre': {
        const id = searchParams.get('id')
        if (!id) {
          return NextResponse.json({ error: 'Genre ID required' }, { status: 400 })
        }

        const genre = await chartmetric.getGenre(parseInt(id))
        return NextResponse.json(genre)
      }

      case 'filtered-tracks': {
        const params: any = {}
        
        // Parse all query parameters
        for (const [key, value] of searchParams.entries()) {
          if (key === 'action') continue
          
          if (key === 'genres' || key === 'artists') {
            params[key] = value.split(',').map(Number)
          } else if (key === 'limit' || key === 'offset') {
            params[key] = parseInt(value)
          } else if (key === 'sortOrderDesc') {
            params[key] = value === 'true'
          } else {
            params[key] = value
          }
        }

        const tracks = await chartmetric.getFilteredTracks(params)
        return NextResponse.json(tracks)
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Chartmetric API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data from Chartmetric' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!CHARTMETRIC_REFRESH_TOKEN) {
      return NextResponse.json({ 
        error: 'Chartmetric API is not configured. Please set CHARTMETRIC_REFRESH_TOKEN environment variable.' 
      }, { status: 503 })
    }

    const chartmetric = getChartmetricAPI()
    const body = await request.json()
    const { action } = body

    if (!action) {
      return NextResponse.json({ error: 'Action parameter required' }, { status: 400 })
    }

    switch (action) {
      case 'search': {
        const { q, limit = 10, offset = 0, type = 'all', beta = false } = body
        if (!q) {
          return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
        }

        const results = await chartmetric.search({
          q,
          limit,
          offset,
          type,
          beta,
        })

        return NextResponse.json(results)
      }

      case 'track': {
        const { trackId } = body
        if (!trackId) {
          return NextResponse.json({ error: 'Track ID required' }, { status: 400 })
        }

        const track = await chartmetric.getTrack(trackId)
        return NextResponse.json(track)
      }

      case 'batch-search': {
        const { queries } = body
        if (!Array.isArray(queries)) {
          return NextResponse.json({ error: 'Queries must be an array' }, { status: 400 })
        }

        const results = await Promise.allSettled(
          queries.map((query: any) => chartmetric.search(query))
        )

        return NextResponse.json(results)
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Chartmetric API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
