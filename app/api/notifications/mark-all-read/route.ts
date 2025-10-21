import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user_id)
      .eq('read', false)
      .select()

    if (error) {
      console.error('Error marking all notifications as read:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, count: data?.length || 0 })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
