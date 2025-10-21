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
      .from('mastering_jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: jobs, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch mastering jobs', details: error.message },
        { status: 500 }
      )
    }

    // Manually fetch profile data
    const jobsWithProfiles = await Promise.all(
      (jobs || []).map(async (job) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', job.user_id)
          .single()

        return {
          ...job,
          profiles: profile || { full_name: 'Unknown', email: 'unknown@email.com' }
        }
      })
    )

    // Calculate stats
    const stats = {
      total: jobsWithProfiles.length,
      pending: jobsWithProfiles.filter(j => j.status === 'pending').length,
      processing: jobsWithProfiles.filter(j => j.status === 'processing').length,
      completed: jobsWithProfiles.filter(j => j.status === 'completed').length,
      failed: jobsWithProfiles.filter(j => j.status === 'failed').length,
      totalCost: jobsWithProfiles.reduce((sum, j) => sum + (j.api_cost || 0), 0)
    }

    return NextResponse.json({ 
      jobs: jobsWithProfiles,
      stats,
      success: true 
    })
  } catch (error) {
    console.error('Admin mastering jobs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mastering jobs' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, action, data } = await request.json()
    
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
      updated_at: new Date().toISOString()
    }

    switch (action) {
      case 'flag':
        updateData.admin_review_status = 'flagged'
        if (data?.admin_notes) updateData.admin_notes = data.admin_notes
        break
      
      case 'review':
        updateData.admin_review_status = 'reviewed'
        if (data?.admin_notes) updateData.admin_notes = data.admin_notes
        break
      
      case 'refund':
        updateData.admin_review_status = 'refunded'
        updateData.refunded_at = new Date().toISOString()
        if (data?.refund_amount) updateData.refund_amount = data.refund_amount
        if (data?.refund_reason) updateData.refund_reason = data.refund_reason
        break
      
      case 'update_cost':
        if (data?.api_cost) updateData.api_cost = data.api_cost
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const { error: updateError } = await supabase
      .from('mastering_jobs')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update mastering job' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: `Mastering job ${action} successfully`
    })
  } catch (error) {
    console.error('Admin mastering job update error:', error)
    return NextResponse.json(
      { error: 'Failed to update mastering job' },
      { status: 500 }
    )
  }
}
