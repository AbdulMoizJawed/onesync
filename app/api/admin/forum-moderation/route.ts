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

    // Fetch content flags
    const { data: flags, error } = await supabase
      .from('forum_content_flags')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch content flags', details: error.message },
        { status: 500 }
      )
    }

    // Manually fetch reporter and content details
    const flagsWithData = await Promise.all(
      (flags || []).map(async (flag) => {
        // Fetch reporter info
        const { data: reporter } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', flag.reporter_id)
          .single()

        // Fetch content details
        let content = null
        if (flag.content_type === 'post') {
          const { data: post } = await supabase
            .from('forum_posts')
            .select('id, title, content, user_id')
            .eq('id', flag.content_id)
            .single()
          content = post
        } else if (flag.content_type === 'comment') {
          const { data: comment } = await supabase
            .from('forum_comments')
            .select('id, content, user_id, post_id')
            .eq('id', flag.content_id)
            .single()
          content = comment
        }

        return {
          ...flag,
          reporter: reporter || { full_name: 'Unknown', email: 'unknown@email.com' },
          content
        }
      })
    )

    return NextResponse.json({ 
      flags: flagsWithData,
      count: flagsWithData.length,
      success: true 
    })
  } catch (error) {
    console.error('Admin forum moderation error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content flags' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, action, admin_notes, admin_action } = await request.json()
    
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

    let updateData: any = {
      reviewed_at: new Date().toISOString()
    }

    switch (action) {
      case 'dismiss':
        updateData.status = 'dismissed'
        if (admin_notes) updateData.admin_notes = admin_notes
        break
      
      case 'action':
        updateData.status = 'actioned'
        if (admin_notes) updateData.admin_notes = admin_notes
        if (admin_action) updateData.admin_action = admin_action
        break
      
      case 'review':
        updateData.status = 'reviewed'
        if (admin_notes) updateData.admin_notes = admin_notes
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const { error: updateError } = await supabase
      .from('forum_content_flags')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update content flag' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: `Content flag ${action} successfully`
    })
  } catch (error) {
    console.error('Admin forum moderation update error:', error)
    return NextResponse.json(
      { error: 'Failed to update content flag' },
      { status: 500 }
    )
  }
}

// Endpoint to suspend users
export async function POST(request: NextRequest) {
  try {
    const { user_id, reason, suspension_type, expires_at, admin_notes } = await request.json()
    
    if (!user_id || !reason || !suspension_type) {
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

    const { data, error } = await supabase
      .from('user_suspensions')
      .insert({
        user_id,
        reason,
        suspension_type,
        expires_at: expires_at || null,
        admin_notes,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create suspension' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      suspension: data,
      success: true,
      message: 'User suspended successfully'
    })
  } catch (error) {
    console.error('Admin user suspension error:', error)
    return NextResponse.json(
      { error: 'Failed to suspend user' },
      { status: 500 }
    )
  }
}
