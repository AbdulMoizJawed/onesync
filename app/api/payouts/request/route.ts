import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const payoutRequestSchema = z.object({
  payout_method_id: z.string().uuid(),
  amount: z.number().positive().min(10), // Minimum $10 payout
})

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get payout requests with method details
  const { data: requests, error } = await supabase
    .from('payout_requests')
    .select(`
      *,
      payout_methods (
        method_type,
        paypal_email,
        account_holder_name,
        bank_name
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requests: requests || [] })
}

export async function POST(req: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { payout_method_id, amount } = payoutRequestSchema.parse(body)

    // Check if payout method belongs to user
    const { data: payoutMethod } = await supabase
      .from('payout_methods')
      .select('*')
      .eq('id', payout_method_id)
      .eq('user_id', user.id)
      .single()

    if (!payoutMethod) {
      return NextResponse.json({ error: 'Invalid payout method' }, { status: 400 })
    }

    // Get available balance from existing earnings
    const { data: earnings } = await supabase
      .from('earnings')
      .select('amount')
      .eq('user_id', user.id)
      .eq('status', 'available')

    const totalPending = earnings?.reduce((sum, earning) => sum + (earning.amount || 0), 0) || 0

    if (totalPending < amount) {
      return NextResponse.json({ 
        error: 'Insufficient balance',
        available: totalPending 
      }, { status: 400 })
    }

    // Create payout request
    const { data: payoutRequest, error: createError } = await supabase
      .from('payout_requests')
      .insert({
        user_id: user.id,
        payout_method_id,
        amount,
        status: 'pending'
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Send notification to admin
    await supabase
      .from('admin_notifications')
      .insert({
        type: 'payout_request',
        title: 'New Payout Request',
        message: `${user.email} requested a $${amount} payout via ${payoutMethod.method_type}`,
        priority: 'high',
        data: { 
          user_id: user.id, 
          request_id: payoutRequest.id,
          amount,
          method: payoutMethod.method_type
        }
      })

    return NextResponse.json({ 
      request: payoutRequest,
      message: 'Payout request submitted successfully' 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
