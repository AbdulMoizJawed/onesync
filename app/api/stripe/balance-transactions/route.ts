import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Stripe from 'stripe'
import { createStripeClient } from '@/lib/stripe-server'

export async function GET(request: NextRequest) {
  try {
    const stripe = createStripeClient()
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters for pagination and filtering
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 100)
    const startingAfter = url.searchParams.get('starting_after')
    const endingBefore = url.searchParams.get('ending_before')
    const type = url.searchParams.get('type')
    const currency = url.searchParams.get('currency')

    // Get Stripe account from header
    const stripeAccount = request.headers.get('Stripe-Account')
    if (!stripeAccount) {
      return NextResponse.json({ error: 'Stripe account required' }, { status: 400 })
    }

    // Verify the Stripe account belongs to the user
    const { data: accountData, error: accountError } = await supabase
      .from('stripe_accounts')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .eq('stripe_account_id', stripeAccount)
      .single()

    if (accountError || !accountData) {
      return NextResponse.json({ error: 'Invalid Stripe account' }, { status: 403 })
    }

    // Build parameters for Stripe API
    const params: Stripe.BalanceTransactionListParams = {
      limit,
      ...(startingAfter && { starting_after: startingAfter }),
      ...(endingBefore && { ending_before: endingBefore }),
      ...(type && { type: type as Stripe.BalanceTransaction.Type }),
      ...(currency && { currency })
    }

    // Retrieve balance transactions from Stripe
    const balanceTransactions = await stripe.balanceTransactions.list(
      params,
      { stripeAccount: stripeAccount }
    )

    return NextResponse.json(balanceTransactions)

  } catch (error) {
    console.error('Error retrieving balance transactions:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve balance transactions' },
      { status: 500 }
    )
  }
}
