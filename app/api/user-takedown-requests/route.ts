// app/api/admin/user-takedown-requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
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
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const adminSupabase = createClient(supabaseUrl, supabaseKey)

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Get filter from query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = adminSupabase
      .from('user_takedown_requests')
      .select(`
        *,
        profiles:user_id (
          username,
          email
        ),
        releases:release_id (
          title,
          artist_name,
          status,
          platforms,
          cover_art_url
        )
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: takedownRequests, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch takedown requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: takedownRequests || [],
      count: takedownRequests?.length || 0
    })

  } catch (error) {
    console.error('Admin takedown requests error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch takedown requests' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const adminSupabase = createClient(supabaseUrl, supabaseKey)

    // Check if user is admin
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { id, status, admin_notes, action } = await request.json()
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required parameters: id and status' },
        { status: 400 }
      )
    }

    // Get the takedown request details
    const { data: takedownRequest, error: fetchError } = await adminSupabase
      .from('user_takedown_requests')
      .select('*, releases(*)')
      .eq('id', id)
      .single()

    if (fetchError || !takedownRequest) {
      return NextResponse.json(
        { error: 'Takedown request not found' },
        { status: 404 }
      )
    }

    // Update the takedown request status
    const updateData: any = {
      status,
      admin_notes: admin_notes || null,
      updated_at: new Date().toISOString()
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { error: updateError } = await adminSupabase
      .from('user_takedown_requests')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating takedown request:', updateError)
      return NextResponse.json(
        { error: 'Failed to update takedown request' },
        { status: 500 }
      )
    }

    // If action is to actually take down the release
    if (action === 'takedown' && status === 'in_progress') {
      // Update release status to indicate it's being taken down
      const { error: releaseUpdateError } = await adminSupabase
        .from('releases')
        .update({ 
          status: 'takedown_in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', takedownRequest.release_id)

      if (releaseUpdateError) {
        console.error('Error updating release status:', releaseUpdateError)
      }

      // Here you would integrate with distribution platform APIs
      // to actually remove the release from Spotify, Apple Music, etc.
      // For now, we'll just update the status
      
      // Log the action
      await adminSupabase
        .from('activity_log')
        .insert({
          user_id: user.id,
          action: 'takedown_initiated',
          entity_type: 'release',
          entity_id: takedownRequest.release_id,
          details: {
            takedown_request_id: id,
            reason: takedownRequest.reason,
            platforms: takedownRequest.platforms
          },
          created_at: new Date().toISOString()
        })
    }

    // If completed, mark release as taken down
    if (status === 'completed') {
      const { error: releaseUpdateError } = await adminSupabase
        .from('releases')
        .update({ 
          status: 'taken_down',
          updated_at: new Date().toISOString()
        })
        .eq('id', takedownRequest.release_id)

      if (releaseUpdateError) {
        console.error('Error marking release as taken down:', releaseUpdateError)
      }
    }

    // Create notification for the user
    let notificationMessage = ''
    let notificationTitle = ''

    switch (status) {
      case 'in_progress':
        notificationTitle = 'Takedown Request In Progress'
        notificationMessage = `Your takedown request for "${takedownRequest.release_title}" is now being processed.`
        break
      case 'completed':
        notificationTitle = 'Takedown Completed'
        notificationMessage = `Your release "${takedownRequest.release_title}" has been successfully taken down from distribution platforms.`
        break
      case 'rejected':
        notificationTitle = 'Takedown Request Rejected'
        notificationMessage = `Your takedown request for "${takedownRequest.release_title}" has been rejected. ${admin_notes ? 'Reason: ' + admin_notes : ''}`
        break
    }

    if (notificationMessage) {
      await adminSupabase
        .from('notifications')
        .insert({
          user_id: takedownRequest.user_id,
          type: `takedown_${status}`,
          title: notificationTitle,
          message: notificationMessage,
          read: false,
          created_at: new Date().toISOString()
        })
    }

    return NextResponse.json({ 
      success: true,
      message: `Takedown request ${status} successfully`
    })

  } catch (error) {
    console.error('Admin takedown update error:', error)
    return NextResponse.json(
      { error: 'Failed to update takedown request' },
      { status: 500 }
    )
  }
}