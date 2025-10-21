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

    // Get takedown requests
    const { data: takedownRequests, error } = await supabase
      .from('takedown_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch takedown requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({
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

export async function POST(request: NextRequest) {
  try {
    const { 
      title, 
      artist, 
      complainant, 
      complainant_email, 
      reason, 
      evidence_url,
      release_url 
    } = await request.json()
    
    if (!title || !artist || !complainant || !reason) {
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
      .from('takedown_requests')
      .insert({
        title,
        artist,
        complainant,
        complainant_email,
        reason,
        evidence_url,
        release_url,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create takedown request' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Admin takedown creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create takedown request' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status, admin_notes, action_taken } = await request.json()
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    if (!['pending', 'reviewing', 'approved', 'rejected', 'completed'].includes(status)) {
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

    if (action_taken) {
      updateData.action_taken = action_taken
    }

    if (status === 'completed') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('takedown_requests')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update takedown request' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin takedown update error:', error)
    return NextResponse.json(
      { error: 'Failed to update takedown request' },
      { status: 500 }
    )
  }
}
