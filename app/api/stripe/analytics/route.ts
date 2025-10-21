import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import Stripe from 'stripe'
import { createStripeClient } from '@/lib/stripe-server'

export async function GET(request: NextRequest) {
  try {
    // Initialize Stripe inside the function
    const stripe = createStripeClient()

    // Get cookies for auth token
    const cookieStore = await cookies()
    
    // Find auth cookies
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
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || '30d' // 7d, 30d, 90d, 1y
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

    // Calculate date range based on period
    const now = Math.floor(Date.now() / 1000)
    let startDate: number
    
    switch (period) {
      case '7d':
        startDate = now - (7 * 24 * 60 * 60)
        break
      case '90d':
        startDate = now - (90 * 24 * 60 * 60)
        break
      case '1y':
        startDate = now - (365 * 24 * 60 * 60)
        break
      default: // 30d
        startDate = now - (30 * 24 * 60 * 60)
    }

    // Fetch comprehensive data from Stripe
    const [
      balance,
      balanceTransactions,
      payouts,
      transfers,
      charges
    ] = await Promise.all([
      // Current balance
      stripe.balance.retrieve({ stripeAccount }),
      
      // Balance transactions for the period
      stripe.balanceTransactions.list({
        created: { gte: startDate },
        limit: 100,
        expand: ['data.source']
      }, { stripeAccount }),
      
      // Payouts for the period
      stripe.payouts.list({
        created: { gte: startDate },
        limit: 100
      }, { stripeAccount }),
      
      // Transfers for the period
      stripe.transfers.list({
        created: { gte: startDate },
        limit: 100
      }),
      
      // Charges for the period
      stripe.charges.list({
        created: { gte: startDate },
        limit: 100
      }, { stripeAccount })
    ])

    // Calculate analytics
    const analytics = {
      // Current balance
      currentBalance: {
        available: balance.available.reduce((sum, bal) => sum + bal.amount, 0) / 100,
        pending: balance.pending.reduce((sum, bal) => sum + bal.amount, 0) / 100,
        currency: balance.available[0]?.currency || 'usd'
      },
      
      // Revenue analytics
      revenue: {
        total: balanceTransactions.data
          .filter(txn => txn.type === 'charge' || txn.type === 'payment')
          .reduce((sum, txn) => sum + txn.net, 0) / 100,
        gross: balanceTransactions.data
          .filter(txn => txn.type === 'charge' || txn.type === 'payment')
          .reduce((sum, txn) => sum + txn.amount, 0) / 100,
        fees: balanceTransactions.data
          .filter(txn => txn.type === 'charge' || txn.type === 'payment')
          .reduce((sum, txn) => sum + txn.fee, 0) / 100
      },
      
      // Payout analytics
      payouts: {
        total: payouts.data.reduce((sum, payout) => sum + payout.amount, 0) / 100,
        count: payouts.data.length,
        pending: payouts.data.filter(p => p.status === 'pending').length,
        paid: payouts.data.filter(p => p.status === 'paid').length,
        failed: payouts.data.filter(p => p.status === 'failed').length
      },
      
      // Transfer analytics
      transfers: {
        total: transfers.data.reduce((sum, transfer) => sum + transfer.amount, 0) / 100,
        count: transfers.data.length
      },
      
      // Transaction volume by day
      dailyVolume: getDailyVolume(balanceTransactions.data, startDate, now),
      
      // Transaction types breakdown
      transactionTypes: getTransactionTypesBreakdown(balanceTransactions.data),
      
      // Top revenue sources
      topSources: getTopRevenueSources(balanceTransactions.data),
      
      // Growth metrics
      growth: calculateGrowthMetrics(balanceTransactions.data, period)
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      period,
      dateRange: {
        start: startDate,
        end: now
      }
    })

  } catch (error) {
    console.error('Error retrieving analytics:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    )
  }
}

function getDailyVolume(transactions: Stripe.BalanceTransaction[], startDate: number, endDate: number) {
  const dailyData: { [date: string]: number } = {}
  
  // Initialize all days with 0
  for (let date = startDate; date <= endDate; date += 24 * 60 * 60) {
    const dateStr = new Date(date * 1000).toISOString().split('T')[0]
    dailyData[dateStr] = 0
  }
  
  // Aggregate transactions by day
  transactions.forEach(txn => {
    const dateStr = new Date(txn.created * 1000).toISOString().split('T')[0]
    if (dailyData.hasOwnProperty(dateStr)) {
      dailyData[dateStr] += txn.net / 100
    }
  })
  
  return Object.entries(dailyData).map(([date, amount]) => ({
    date,
    amount
  }))
}

function getTransactionTypesBreakdown(transactions: Stripe.BalanceTransaction[]) {
  const breakdown: { [type: string]: { count: number; amount: number } } = {}
  
  transactions.forEach(txn => {
    if (!breakdown[txn.type]) {
      breakdown[txn.type] = { count: 0, amount: 0 }
    }
    breakdown[txn.type].count += 1
    breakdown[txn.type].amount += txn.net / 100
  })
  
  return Object.entries(breakdown).map(([type, data]) => ({
    type,
    count: data.count,
    amount: data.amount,
    percentage: transactions.length > 0 ? (data.count / transactions.length) * 100 : 0
  }))
}

function getTopRevenueSources(transactions: Stripe.BalanceTransaction[]) {
  const sources: { [source: string]: number } = {}
  
  transactions.forEach(txn => {
    if (txn.type === 'charge' || txn.type === 'payment') {
      const source = txn.description || 'Unknown'
      sources[source] = (sources[source] || 0) + (txn.net / 100)
    }
  })
  
  return Object.entries(sources)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([source, amount]) => ({
      source,
      amount,
      percentage: Object.values(sources).reduce((sum, val) => sum + val, 0) > 0 
        ? (amount / Object.values(sources).reduce((sum, val) => sum + val, 0)) * 100 
        : 0
    }))
}

function calculateGrowthMetrics(transactions: Stripe.BalanceTransaction[], period: string) {
  const now = Date.now() / 1000
  let previousPeriodStart: number
  let currentPeriodStart: number
  
  switch (period) {
    case '7d':
      currentPeriodStart = now - (7 * 24 * 60 * 60)
      previousPeriodStart = now - (14 * 24 * 60 * 60)
      break
    case '90d':
      currentPeriodStart = now - (90 * 24 * 60 * 60)
      previousPeriodStart = now - (180 * 24 * 60 * 60)
      break
    case '1y':
      currentPeriodStart = now - (365 * 24 * 60 * 60)
      previousPeriodStart = now - (730 * 24 * 60 * 60)
      break
    default: // 30d
      currentPeriodStart = now - (30 * 24 * 60 * 60)
      previousPeriodStart = now - (60 * 24 * 60 * 60)
  }
  
  const currentPeriodRevenue = transactions
    .filter(txn => txn.created >= currentPeriodStart && (txn.type === 'charge' || txn.type === 'payment'))
    .reduce((sum, txn) => sum + txn.net, 0) / 100
    
  const previousPeriodRevenue = transactions
    .filter(txn => txn.created >= previousPeriodStart && txn.created < currentPeriodStart && (txn.type === 'charge' || txn.type === 'payment'))
    .reduce((sum, txn) => sum + txn.net, 0) / 100
  
  const growthRate = previousPeriodRevenue > 0 
    ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
    : 0
  
  return {
    currentPeriod: currentPeriodRevenue,
    previousPeriod: previousPeriodRevenue,
    growthRate,
    isPositive: growthRate >= 0
  }
}
