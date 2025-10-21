// app/api/releases/takedown/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Get cookies
    const cookieStore = await cookies()
    
    // Create Supabase client with SSR
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // Parse request body
    const { releaseId, reason, detailedReason, urgency, platforms } = await request.json()
    
    if (!releaseId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: releaseId and reason' },
        { status: 400 }
      )
    }

    // Create admin client for database operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const adminSupabase = createClient(supabaseUrl, supabaseKey)

    // Verify the user owns this release
    const { data: release, error: releaseError } = await adminSupabase
      .from('releases')
      .select('id, title, artist_name, user_id')
      .eq('id', releaseId)
      .single()

    if (releaseError || !release) {
      console.error('Release not found:', releaseError)
      return NextResponse.json(
        { error: 'Release not found' },
        { status: 404 }
      )
    }

    if (release.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to request takedown for this release' },
        { status: 403 }
      )
    }

    // Create the takedown request
    const { data: takedownRequest, error: insertError } = await adminSupabase
      .from('user_takedown_requests')
      .insert({
        user_id: user.id,
        release_id: releaseId,
        release_title: release.title,
        artist_name: release.artist_name,
        reason: reason,
        detailed_reason: detailedReason || null,
        urgency: urgency || 'normal',
        platforms: platforms || [],
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database error creating takedown request:', insertError)
      return NextResponse.json(
        { error: 'Failed to create takedown request' },
        { status: 500 }
      )
    }

    // Create a notification for the user
    const { error: notificationError } = await adminSupabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'takedown_request_submitted',
        title: 'Takedown Request Submitted',
        message: `Your takedown request for "${release.title}" has been submitted and is pending review.`,
        read: false,
        created_at: new Date().toISOString()
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      // Don't fail the request if notification fails
    }

    console.log('Takedown request created successfully:', takedownRequest.id)

    return NextResponse.json({ 
      success: true, 
      data: takedownRequest,
      message: 'Takedown request submitted successfully'
    })

  } catch (error) {
    console.error('Takedown request error:', error)
    return NextResponse.json(
      { error: 'Failed to submit takedown request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}