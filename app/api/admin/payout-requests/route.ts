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

    // Get payout requests (without profile join since relationship doesn't exist)
    const { data: payoutRequests, error } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payout requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: payoutRequests || [],
      count: payoutRequests?.length || 0
    })
  } catch (error) {
    console.error('Admin payout requests error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payout requests' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status, admin_notes } = await request.json()
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected'].includes(status)) {
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

    if (status === 'approved' || status === 'rejected') {
      updateData.processed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('payout_requests')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update payout request' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin payout update error:', error)
    return NextResponse.json(
      { error: 'Failed to update payout request' },
      { status: 500 }
    )
  }
}