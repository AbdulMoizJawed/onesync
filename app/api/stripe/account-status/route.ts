import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Get cookies for auth token
    const cookieStore = await cookies()
    
    // Find auth cookies (different possible names)
    const authCookies = [
      'sb-access-token',
      'sb-refresh-token', 
      'supabase-auth-token',
      'supabase.auth.token'
    ]
    
    let authToken = null
    for (const cookieName of authCookies) {
      const cookie = cookieStore.get(cookieName)
      if (cookie?.value) {
        authToken = cookie.value
        break
      }
    }
    
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    const stripe = getStripe()

    // Try to get user from session or auth token
    let user = null
    let authError = null
    
    try {
      // First try to get user from existing session
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (userError && authToken) {
        // If no session but we have a token, try to set it
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: authToken,
          refresh_token: authToken
        })
        
        if (!sessionError && sessionData.user) {
          user = sessionData.user
        } else {
          authError = sessionError || userError
        }
      } else if (!userError && userData.user) {
        user = userData.user
      } else {
        authError = userError
      }
    } catch (error) {
      authError = error
    }
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Check if user has a Connect account in our database
    const { data: connectAccount, error: dbError } = await supabase
      .from('stripe_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (dbError && dbError.code !== 'PGRST116') {
      console.error('Database error:', dbError)
      return NextResponse.json({ 
        error: 'Database error' 
      }, { status: 500 })
    }

    if (!connectAccount) {
      return NextResponse.json({ 
        connectAccount: null,
        stripeAccount: null 
      }, { status: 404 })
    }

    // Fetch the account details from Stripe
    let stripeAccount = null
    try {
      stripeAccount = await stripe.accounts.retrieve(connectAccount.stripe_account_id)
    } catch (stripeError) {
      console.error('Stripe error:', stripeError)
      return NextResponse.json({ 
        error: 'Failed to fetch Stripe account details' 
      }, { status: 500 })
    }

    // Update our database with current Stripe account status
    const { error: updateError } = await supabase
      .from('stripe_accounts')
      .update({
        account_status: stripeAccount.details_submitted ? 'active' : 'incomplete',
        charges_enabled: stripeAccount.charges_enabled,
        payouts_enabled: stripeAccount.payouts_enabled,
        details_submitted: stripeAccount.details_submitted,
        updated_at: new Date().toISOString()
      })
      .eq('id', connectAccount.id)

    if (updateError) {
      console.error('Update error:', updateError)
    }

    return NextResponse.json({
      connectAccount: {
        ...connectAccount,
        account_status: stripeAccount.details_submitted ? 'active' : 'incomplete',
        charges_enabled: stripeAccount.charges_enabled,
        payouts_enabled: stripeAccount.payouts_enabled,
        details_submitted: stripeAccount.details_submitted
      },
      stripeAccount
    })

  } catch (error) {
    console.error('Account status error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
