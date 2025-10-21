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

    // Get content that needs review (releases with pending status or flagged content)
    const { data: contentReviews, error } = await supabase
      .from('releases')
      .select(`
        *,
        profiles!inner(email, full_name)
      `)
      .in('status', ['pending', 'flagged', 'under_review'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch content reviews' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: contentReviews || [],
      count: contentReviews?.length || 0
    })
  } catch (error) {
    console.error('Admin content reviews error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content reviews' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status, admin_notes, review_type, flags } = await request.json()
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected', 'flagged', 'under_review'].includes(status)) {
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

    if (review_type) {
      updateData.review_type = review_type
    }

    if (flags) {
      updateData.content_flags = flags
    }

    if (status === 'approved' || status === 'rejected') {
      updateData.reviewed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('releases')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update content review' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin content review update error:', error)
    return NextResponse.json(
      { error: 'Failed to update content review' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { release_id, flag_type, reason, reporter_id } = await request.json()
    
    if (!release_id || !flag_type || !reason) {
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

    // Create content flag record
    const { data: flagData, error: flagError } = await supabase
      .from('content_flags')
      .insert({
        release_id,
        flag_type,
        reason,
        reporter_id,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (flagError) {
      console.error('Flag creation error:', flagError)
      return NextResponse.json(
        { error: 'Failed to create content flag' },
        { status: 500 }
      )
    }

    // Update release status to flagged
    const { error: updateError } = await supabase
      .from('releases')
      .update({ 
        status: 'flagged',
        updated_at: new Date().toISOString()
      })
      .eq('id', release_id)

    if (updateError) {
      console.error('Release update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to flag release' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: flagData })
  } catch (error) {
    console.error('Admin content flag creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create content flag' },
      { status: 500 }
    )
  }
}
