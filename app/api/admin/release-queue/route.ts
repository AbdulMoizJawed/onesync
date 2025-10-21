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

    // Use service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all releases (without profile join since relationship doesn't exist)
    const { data: releases, error } = await supabase
      .from('releases')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch release queue' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: releases || [],
      count: releases?.length || 0
    })
  } catch (error) {
    console.error('Admin release queue error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch release queue' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, action, reason } = await request.json()
    
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

    let status
    switch (action) {
      case 'approve':
        status = 'approved'
        break
      case 'reject':
        status = 'rejected'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const updateData: any = { status }
    if (reason) {
      updateData.admin_notes = reason
    }

    const { error } = await supabase
      .from('releases')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update release' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin release update error:', error)
    return NextResponse.json(
      { error: 'Failed to update release' },
      { status: 500 }
    )
  }
}