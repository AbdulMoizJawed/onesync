import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    // Get the authorization header
    const authorization = req.headers.get('authorization')
    
    if (!authorization) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    // Extract the JWT token from the Authorization header
    const token = authorization.replace('Bearer ', '')
    
    // Allow a dev-only test path: if the caller passed the service role key as
    // the bearer token and ?debug=1 and provided an as_user=<userId> param, we
    // treat this as a local test (skip normal JWT verification). This is
    // strictly disabled in production.
  const isDevDebug = req.nextUrl.searchParams.get('debug') === '1' && process.env.NODE_ENV !== 'production'
    let user: any = null

  if (token === process.env.SUPABASE_SERVICE_ROLE_KEY && isDevDebug) {
      const asUser = req.nextUrl.searchParams.get('as_user')
      if (asUser) {
        user = { id: asUser }
      }
    }

    // Verify the token with Supabase when not using the dev service-role bypass.
    if (!user) {
      const { data: authData, error: authError } = await supabase.auth.getUser(token)
      if (authError || !authData?.user) {
        console.error('Auth error:', authError)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      user = authData.user
    }

    // Find artist IDs owned by this user and fetch releases for those artists
    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .select('id')
      .eq('user_id', user.id)

    if (artistsError) {
      console.error('Error fetching artists for user:', artistsError)
      return NextResponse.json({ error: 'Failed to fetch artists' }, { status: 500 })
    }

    const artistIds = (artists || []).map((a: any) => a.id)

    if (artistIds.length === 0) {
      // User has no artists; return empty array
      const debugMode = req.nextUrl.searchParams.get('debug') === '1' && process.env.NODE_ENV !== 'production'
      return NextResponse.json(debugMode ? { success: true, releases: [], debug: { artistCount: 0, artistIds: [] } } : { success: true, releases: [] })
    }

    // Get user's approved/live releases for campaigns.
    // Some releases are linked to an artist via artist_id, others are owned directly by the user (user_id).
    // Fetch both sets and merge/dedupe them so the client sees all releases the user should be able to pick.
  // Select the real column name and map to the expected artwork_url field in JS
  const selectCols = "id, title, artist_name, release_date, cover_art_url, status, created_at"

    // Fetch releases for the user's artists (if any) and releases owned directly by the user.
    const releasesByArtistPromise: Promise<any> = artistIds.length > 0
      ? Promise.resolve(supabase.from('releases').select(selectCols).in('artist_id', artistIds).in('status', ['approved', 'live', 'distributed']).order('created_at', { ascending: false }).then(r => r))
      : Promise.resolve({ data: [], error: null })

    const releasesByUserPromise: Promise<any> = Promise.resolve(supabase.from('releases').select(selectCols).eq('user_id', user.id).in('status', ['approved', 'live', 'distributed']).order('created_at', { ascending: false }).then(r => r))

    const [byArtistRes, byUserRes] = await Promise.all([releasesByArtistPromise, releasesByUserPromise])

    // Collect errors (if any)
    const errors: any[] = []
    if (byArtistRes && (byArtistRes as any).error) errors.push((byArtistRes as any).error)
    if (byUserRes && (byUserRes as any).error) errors.push((byUserRes as any).error)
    if (errors.length > 0) {
      console.error('Error fetching releases:', errors)
      const debugMode = req.nextUrl.searchParams.get('debug') === '1' && process.env.NODE_ENV !== 'production'
      return NextResponse.json(debugMode ? { error: 'Failed to fetch releases', debug: { sqlErrors: errors } } : { error: 'Failed to fetch releases' }, { status: 500 })
    }

  const combined: any[] = [ ...(byArtistRes?.data || []), ...(byUserRes?.data || []) ]
    // dedupe by id, keep the first occurrence
    const seen = new Map()
    const deduped: any[] = []
    for (const r of combined as any[]) {
      const id = (r as any).id
      if (!seen.has(id)) {
        seen.set(id, true)
        deduped.push(r)
      }
    }

  const debugMode = req.nextUrl.searchParams.get('debug') === '1' && process.env.NODE_ENV !== 'production'
  // Normalize field name expected by client
  const normalized = (deduped || []).map((r: any) => ({ ...r, artwork_url: r.artwork_url || r.cover_art_url }))
  const baseResponse: any = { success: true, releases: normalized }
    if (debugMode) {
      baseResponse.debug = {
        artistCount: artistIds.length,
        artistIds,
        releasesCount: deduped.length
      }
    }

    return NextResponse.json(baseResponse)

  } catch (error) {
    console.error('Error in get-releases API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
