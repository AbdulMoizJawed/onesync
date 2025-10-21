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

    const { amount, destination, currency = 'usd' } = await request.json()

    if (!amount || !destination) {
      return withCors({ error: 'Missing required fields' }, { status: 400 })
    }

    const stripe = getStripe()
    
    const payout = await stripe.payouts.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      destination
    })

    return withCors({ 
      success: true, 
      payout: {
        id: payout.id,
        amount: payout.amount / 100,
        currency: payout.currency,
        status: payout.status,
        arrival_date: payout.arrival_date
      }
    })

  } catch (error) {
    console.error('Create payout error:', error)
    return withCors({ 
      error: 'Failed to create payout' 
    }, { status: 500 })
  }
}
