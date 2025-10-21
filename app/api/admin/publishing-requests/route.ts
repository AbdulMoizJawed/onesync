// @ts-nocheck
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

    // Fetch publishing requests
    const { data: requests, error } = await supabase
      .from('publishing_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch publishing requests', details: error.message },
        { status: 500 }
      )
    }

    // Manually fetch profile data for each request
    const requestsWithProfiles = await Promise.all(
      (requests || []).map(async (req) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, created_at')
          .eq('id', req.user_id)
          .single()

        return {
          ...req,
          profiles: profile || {
            id: req.user_id,
            full_name: 'Unknown User',
            email: req.user_email || 'unknown@email.com',
            role: 'user',
            created_at: req.created_at
          }
        }
      })
    )

    return NextResponse.json({ 
      requests: requestsWithProfiles,
      success: true 
    })
  } catch (error) {
    console.error('Admin publishing requests error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch publishing requests' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, action, admin_notes } = await req.json()
    
    if (!id || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
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

    // Get the current request to access user info
    const { data: request, error: fetchError } = await supabase
      .from('publishing_requests')
      .select('*, profiles!inner(full_name, email)')
      .eq('id', id)
      .single()

    if (fetchError || !request) {
      return NextResponse.json(
        { error: 'Publishing request not found' },
        { status: 404 }
      )
    }

    const status = action === 'approve' ? 'approved' : 'rejected'
    const updateData: any = {
      status,
      admin_notes,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Update the publishing request
    const { error: updateError } = await supabase
      .from('publishing_requests')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update publishing request' },
        { status: 500 }
      )
    }

    // If approved, update user role to include publishing access
    if (action === 'approve') {
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ 
          role: 'premium',  // or whatever role grants publishing access
          updated_at: new Date().toISOString()
        })
        .eq('id', request.user_id)

      if (roleError) {
        console.error('Failed to update user role:', roleError)
        // Don't fail the whole request, just log the error
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Publishing request ${action}d successfully`
    })
  } catch (error) {
    console.error('Admin publishing request update error:', error)
    return NextResponse.json(
      { error: 'Failed to update publishing request' },
      { status: 500 }
    )
  }
}
