import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { releaseId, action, timestamp } = await request.json()

    if (!releaseId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Log the chart registration action
    const { data, error } = await supabase
      .from('chart_registration_logs')
      .insert({
        release_id: releaseId,
        action,
        timestamp: timestamp || new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Error logging chart registration:', error)
      // Don't fail the request if logging fails
      return NextResponse.json({ success: true, logged: false })
    }

    return NextResponse.json({ success: true, logged: true, data })
  } catch (error) {
    console.error('Server error:', error)
    // Don't fail the request if logging fails
    return NextResponse.json({ success: true, logged: false })
  }
}
