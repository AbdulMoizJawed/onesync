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

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get sync requests with release and user information
    const { data: syncRequests, error } = await supabase
      .from('sync_requests')
      .select(`
        *,
        releases!inner(title, artist, cover_art),
        profiles!inner(email, full_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sync requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: syncRequests || [],
      count: syncRequests?.length || 0
    })
  } catch (error) {
    console.error('Admin sync requests error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sync requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { release_id, user_id, platforms, sync_data } = await request.json()
    
    if (!release_id || !user_id || !platforms || !Array.isArray(platforms)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('sync_requests')
      .insert({
        release_id,
        user_id,
        platforms,
        sync_data: sync_data || {},
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create sync request' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Admin sync request creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create sync request' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status, admin_notes, error_message, sync_data } = await request.json()
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    if (!['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    }
    
    if (admin_notes) {
      updateData.admin_notes = admin_notes
    }

    if (error_message) {
      updateData.error_message = error_message
    }

    if (sync_data) {
      updateData.sync_data = sync_data
    }

    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('sync_requests')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update sync request' },
        { status: 500 }
      )
    }

    // If completed successfully, update release distribution status
    if (status === 'completed') {
      await supabase
        .from('releases')
        .update({ distribution_status: 'distributed' })
        .eq('id', updateData.release_id || id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin sync request update error:', error)
    return NextResponse.json(
      { error: 'Failed to update sync request' },
      { status: 500 }
    )
  }
}
