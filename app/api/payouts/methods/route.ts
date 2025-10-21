import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'
import validateRoutingNumber from 'routing-number-validator'

// Validation schemas
const paypalSchema = z.object({
  method_type: z.literal('paypal'),
  paypal_email: z.string().email(),
  is_primary: z.boolean().default(false)
})

const bankSchema = z.object({
  method_type: z.literal('bank_transfer'),
  account_holder_name: z.string().min(1),
  account_number: z.string().min(1),
  routing_number: z.string().min(9).max(9).refine((val) => {
    try {
      return validateRoutingNumber(val)
    } catch {
      return false
    }
  }, {
    message: "Invalid routing number"
  }),
  bank_name: z.string().min(1),
  bank_country: z.string().length(2).default('US'),
  is_primary: z.boolean().default(false)
})

const payoutMethodSchema = z.discriminatedUnion('method_type', [
  paypalSchema,
  bankSchema
])

function maskSensitiveData(method: any) {
  return {
    ...method,
    account_number: method.account_number ? `****${method.account_number.slice(-4)}` : null,
    routing_number: method.routing_number ? `****${method.routing_number.slice(-4)}` : null
  }
}

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get payout methods directly by user_id
  const { data: methods, error } = await supabase
    .from('payout_methods')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mask sensitive data
  const maskedMethods = methods?.map(maskSensitiveData) || []

  return NextResponse.json({ methods: maskedMethods })
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
    const validated = payoutMethodSchema.parse(body)

    // Add user_id to the data
    const payoutData = {
      ...validated,
      user_id: user.id
    }

    // If setting as primary, unset other primary methods
    if (payoutData.is_primary) {
      await supabase
        .from('payout_methods')
        .update({ is_primary: false })
        .eq('user_id', user.id)
    }

    // Insert new payout method
    const { data, error } = await supabase
      .from('payout_methods')
      .insert(payoutData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send notification to admin about new payout method
    await supabase
      .from('admin_notifications')
      .insert({
        type: 'new_payout_method',
        title: 'New Payout Method Added',
        message: `Artist ${user.email} added a new ${validated.method_type} payout method`,
        data: { user_id: user.id, method_id: data.id }
      })

    return NextResponse.json({ method: maskSensitiveData(data) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
