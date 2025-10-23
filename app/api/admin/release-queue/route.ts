// app/api/admin/release-queue/route.ts
// Updated with sorting logic

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

    // Sort releases: pending first, then by priority
    const sortedReleases = (releases || []).sort((a, b) => {
      // Define status priority (lower number = higher priority)
      const statusPriority: { [key: string]: number } = {
        'pending': 0,      // Highest priority - needs review
        'processing': 1,   // Being worked on
        'draft': 1,        // Draft state
        'approved': 2,     // Already approved
        'live': 2,         // Already live
        'rejected': 3      // Lowest priority
      }
      
      const priorityA = statusPriority[a.status] ?? 4
      const priorityB = statusPriority[b.status] ?? 4
      
      // Sort by status priority first
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }
      
      // Within same status, sort by created date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    console.log('✅ Fetched and sorted releases:', {
      total: sortedReleases.length,
      pending: sortedReleases.filter(r => r.status === 'pending').length,
      approved: sortedReleases.filter(r => r.status === 'approved' || r.status === 'live').length,
      rejected: sortedReleases.filter(r => r.status === 'rejected').length
    })

    return NextResponse.json({
      data: sortedReleases,
      count: sortedReleases.length
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
    
    console.log('📥 PATCH request:', { id, action, reason })
    
    // Validate required fields
    if (!id || !action) {
      return NextResponse.json(
        { error: 'Missing id or action' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check if release exists
    console.log('🔍 Checking if release exists:', id)
    const { data: existing, error: fetchError } = await supabase
      .from('releases')
      .select('id, title, status, user_id')
      .eq('id', id)
      .limit(1)

    if (fetchError || !existing || existing.length === 0) {
      console.error('❌ Release not found:', fetchError)
      return NextResponse.json(
        { error: 'Release not found' },
        { status: 404 }
      )
    }

    console.log('✅ Found release:', existing[0].title, '| Current status:', existing[0].status)

    // Build update object
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    // Add action-specific fields
    if (action === 'approve') {
      updateData.approved_at = new Date().toISOString()
      console.log('✅ Approving release')
    } else if (action === 'reject') {
      if (reason) {
        updateData.admin_notes = reason
        updateData.rejection_reason = reason
      }
      updateData.rejected_at = new Date().toISOString()
      console.log('⛔ Rejecting release with reason:', reason || 'No reason provided')
    }

    console.log('📝 Update data:', updateData)

    // Perform update
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
      console.error('❌ Update returned no data')
      return NextResponse.json(
        { error: 'Update returned no data' },
        { status: 500 }
      )
    }

    console.log('✅ Successfully updated release to status:', updated[0].status)

    // Optional: Send notification to user (you can implement this)
    // await sendNotificationToUser(existing[0].user_id, action, updated[0])

    return NextResponse.json({
      success: true,
      message: `Release ${action}d successfully`,
      data: updated[0]
    })

  } catch (error: any) {
    console.error('❌ PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}