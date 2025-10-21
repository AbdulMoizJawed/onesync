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
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('beats')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('approval_status', status)
    }

    const { data: beats, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch beats', details: error.message },
        { status: 500 }
      )
    }

    // Manually fetch profile data
    const beatsWithProfiles = await Promise.all(
      (beats || []).map(async (beat) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', beat.user_id)
          .single()

        return {
          ...beat,
          profiles: profile || { full_name: 'Unknown', email: 'unknown@email.com' }
        }
      })
    )

    return NextResponse.json({ 
      beats: beatsWithProfiles,
      count: beatsWithProfiles.length,
      success: true 
    })
  } catch (error) {
    console.error('Admin beats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch beats' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, action, admin_notes } = await request.json()
    
    if (!id || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
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
      admin_notes,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (action === 'approve') {
      updateData.approval_status = 'approved'
    } else if (action === 'reject') {
      updateData.approval_status = 'rejected'
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('beats')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update beat' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: `Beat ${action}d successfully`
    })
  } catch (error) {
    console.error('Admin beat update error:', error)
    return NextResponse.json(
      { error: 'Failed to update beat' },
      { status: 500 }
    )
  }
}
