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

    // Get admin notifications
    const { data: notifications, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: notifications || [],
      count: notifications?.length || 0
    })
  } catch (error) {
    console.error('Admin notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, title, message, type, data } = await request.json()
    
    if (!title || !message || !type) {
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

    // If user_id is provided, send to specific user via user_notifications table
    if (user_id) {
      const { data: notification, error } = await supabase
        .from('user_notifications')
        .insert({
          user_id,
          title,
          message,
          type,
          data: data || {},
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to send notification' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data: notification })
    } else {
      // Send to admin notifications (system-wide)
      const { data: notification, error } = await supabase
        .from('admin_notifications')
        .insert({
          title,
          message,
          type,
          data: data || {},
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to create notification' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data: notification })
    }
  } catch (error) {
    console.error('Admin notification creation error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, read } = await request.json()
    
    if (!id || typeof read !== 'boolean') {
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

    const { error } = await supabase
      .from('admin_notifications')
      .update({ read })
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin notification update error:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}
