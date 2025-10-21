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

export async function POST(request: NextRequest) {
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

    const { schedule } = await request.json()

    if (!schedule || !schedule.interval) {
      return withCors({ error: 'Invalid payout schedule' }, { status: 400 })
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
    
    // Update payout settings
    const updatedAccount = await stripe.accounts.update(stripeAccount.stripe_account_id, {
      settings: {
        payouts: {
          schedule: {
            interval: schedule.interval,
            ...(schedule.monthly_anchor && { monthly_anchor: schedule.monthly_anchor }),
            ...(schedule.weekly_anchor && { weekly_anchor: schedule.weekly_anchor })
          }
        }
      }
    })

    return withCors({ 
      success: true, 
      schedule: updatedAccount.settings?.payouts?.schedule 
    })

  } catch (error) {
    console.error('Update payout settings error:', error)
    return withCors({ 
      error: 'Failed to update payout settings' 
    }, { status: 500 })
  }
}
