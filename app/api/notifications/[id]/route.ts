import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const { id } = params
    const { read } = await request.json()

    const { data, error } = await supabase
      .from('notifications')
      .update({ read })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating notification:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE functionality removed - notifications cannot be deleted by users
// This preserves notification history and audit trails
