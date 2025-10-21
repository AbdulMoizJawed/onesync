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
      return withCors({ 
        error: 'Unauthorized', 
        details: authError instanceof Error ? authError.message : 'Authentication failed' 
      }, { status: 401 })
    }

    // Check existing
    const { data: existing } = await supabase
      .from('stripe_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let accountId = existing?.stripe_account_id

    if (!accountId) {
      // Optionally capture email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single()

      const email = profile?.email || user.email || undefined

      const account = await stripe.accounts.create({
        type: 'express',
        email,
        country: 'US',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: { user_id: user.id, platform: 'music-distribution' },
      })

      accountId = account.id

      await supabase.rpc('create_or_update_stripe_account', {
        p_user_id: user.id,
        p_stripe_account_id: accountId,
        p_account_type: 'express',
        p_onboarding_completed: false,
        p_payouts_enabled: false,
        p_charges_enabled: false,
      })
    }

    return withCors({ success: true, accountId })
  } catch (error: any) {
    const message = error?.message || 'Failed to create connect account'
    return withCors({ error: message }, { status: 500 })
  }
}
