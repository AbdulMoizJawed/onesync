import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    // Use service role client for admin operations (no auth needed for now)
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get basic stats
    const [usersResult, releasesResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('releases').select('id', { count: 'exact', head: true })
    ])

    const stats = {
      totalUsers: usersResult.count || 0,
      totalReleases: releasesResult.count || 0,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    )
  }
}