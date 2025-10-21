import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

function withCors(json: any, init?: ResponseInit) {
  const res = NextResponse.json(json, init)
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  return res
}

export async function OPTIONS() {
  return withCors({ ok: true })
}

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

    // Try to get user from session or auth token
    let user = null
    let authError = null
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (userError && authToken) {
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
      return withCors({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Stripe account
    const { data: stripeAccount } = await supabase
      .from('stripe_accounts')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single()

    if (!stripeAccount?.stripe_account_id) {
      return withCors({ error: 'No Stripe account found' }, { status: 404 })
    }

    const stripe = getStripe()
    
    // Create new onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccount.stripe_account_id,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/stripe/onboarding-refresh`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/stripe/onboarding-return`,
      type: 'account_onboarding'
    })

    return withCors({ 
      success: true, 
      url: accountLink.url 
    })

  } catch (error) {
    console.error('Onboarding refresh error:', error)
    return withCors({ 
      error: 'Failed to refresh onboarding' 
    }, { status: 500 })
  }
}
