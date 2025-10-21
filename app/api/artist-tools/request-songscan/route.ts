import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { releaseId } = body

    if (!releaseId) {
      return NextResponse.json({ error: 'Release ID is required' }, { status: 400 })
    }

    // Get release details
    const { data: release, error: releaseError } = await supabase
      .from('releases')
      .select('*')
      .eq('id', releaseId)
      .eq('user_id', user.id)
      .single()

    if (releaseError || !release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 })
    }

    // Check if SongScan registration already exists
    const { data: existingRequest } = await supabase
      .from('songscan_requests')
      .select('*')
      .eq('release_id', releaseId)
      .eq('user_id', user.id)
      .single()

    if (existingRequest) {
      return NextResponse.json({ 
        error: 'SongScan registration already requested for this release',
        status: existingRequest.status 
      }, { status: 400 })
    }

    // Create SongScan registration request
    const { data: songScanRequest, error: insertError } = await supabase
      .from('songscan_requests')
      .insert({
        user_id: user.id,
        release_id: releaseId,
        release_title: release.title,
        artist_name: release.artist_name,
        upc: release.upc,
        status: 'pending',
        requested_at: new Date().toISOString(),
        metadata: {
          release_date: release.release_date,
          label_name: release.label_name,
          genre: release.genre
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating SongScan request:', insertError)
      return NextResponse.json({ error: 'Failed to create SongScan request' }, { status: 500 })
    }

    // In a real implementation, you would also:
    // 1. Send data to Nielsen SoundScan API
    // 2. Handle response and update status
    // 3. Send confirmation email to user
    
    // For now, we'll simulate the process
    setTimeout(async () => {
      try {
        await supabase
          .from('songscan_requests')
          .update({ 
            status: 'approved',
            processed_at: new Date().toISOString(),
            songscan_id: `SS${Date.now()}`
          })
          .eq('id', songScanRequest.id)
      } catch (error) {
        console.error('Error updating SongScan status:', error)
      }
    }, 5000) // Simulate 5 second processing time

    return NextResponse.json({
      success: true,
      requestId: songScanRequest.id,
      status: 'pending',
      message: 'SongScan registration request submitted successfully. You will receive an email confirmation once processed.'
    })

  } catch (error) {
    console.error('Error in request-songscan API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
