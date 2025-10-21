import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    const { data: releases, error } = await supabase
      .from('releases')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ GET error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch releases' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: releases || [],
      count: releases?.length || 0
    })
  } catch (error) {
    console.error('❌ GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, reason } = body
    
    console.log('📥 PATCH:', { id, action, reason })

    console.log(action, "action in backend ")
    console.log(reason, "action in reason ")

    
    // Validate
    if (!id || !action) {
      return NextResponse.json(
        { error: 'Missing id or action' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check exists
    console.log('🔍 Checking release:', id)
    const { data: existing, error: fetchError } = await supabase
      .from('releases')
      .select('id, title, status')
      .eq('id', id)
      .limit(1)

    if (fetchError || !existing || existing.length === 0) {
      console.error('❌ Not found')
      return NextResponse.json(
        { error: 'Release not found' },
        { status: 404 }
      )
    }

    console.log('✅ Found:', existing[0].title)

    // Build update
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    if (action === 'approve') {
      updateData.approved_at = new Date().toISOString()
    } else if (reason) {
      updateData.admin_notes = reason
      updateData.rejection_reason = reason
    }

    console.log('📝 Updating:', updateData)

    // Update
    const { data: updated, error: updateError } = await supabase
      .from('releases')
      .update(updateData)
      .eq('id', id)
      .select()

    if (updateError) {
      console.error('❌ Update error:', updateError)
      return NextResponse.json(
        { error: 'Update failed', details: updateError.message },
        { status: 500 }
      )
    }

    if (!updated || updated.length === 0) {
      console.error('❌ No data returned')
      return NextResponse.json(
        { error: 'Update returned no data' },
        { status: 500 }
      )
    }

    console.log('✅ Updated to:', updated[0].status)

    return NextResponse.json({
      success: true,
      message: `Release ${action}d successfully`,
      data: updated[0]
    })

  } catch (error: any) {
    console.error('❌ PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}