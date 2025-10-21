import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import Stripe from 'stripe'
import { createStripeClient } from '@/lib/stripe-server'

export async function GET(request: NextRequest) {
  try {
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

    // Get user's Stripe Connect account
    const { data: stripeAccount, error: accountError } = await supabase
      .from('stripe_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (accountError || !stripeAccount) {
      return NextResponse.json({ 
        error: 'No Stripe account found',
        hasStripeAccount: false 
      }, { status: 404 })
    }

    // Get current time periods
    const now = Math.floor(Date.now() / 1000)
    const thisMonthStart = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000)
    const lastMonthStart = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getTime() / 1000)
    const yearStart = Math.floor(new Date(new Date().getFullYear(), 0, 1).getTime() / 1000)

    // Fetch data from Stripe in parallel
    const [
      balance,
      allTransactions,
      thisMonthTransactions,
      lastMonthTransactions,
      yearTransactions,
      payouts,
      account
    ] = await Promise.all([
      // Current balance
      stripe.balance.retrieve({ stripeAccount: stripeAccount.stripe_account_id }),
      
      // All time transactions (last 100)
      stripe.balanceTransactions.list({
        limit: 100
      }, { stripeAccount: stripeAccount.stripe_account_id }),
      
      // This month transactions
      stripe.balanceTransactions.list({
        created: { gte: thisMonthStart },
        limit: 100
      }, { stripeAccount: stripeAccount.stripe_account_id }),
      
      // Last month transactions
      stripe.balanceTransactions.list({
        created: { gte: lastMonthStart, lt: thisMonthStart },
        limit: 100
      }, { stripeAccount: stripeAccount.stripe_account_id }),
      
      // Year to date transactions
      stripe.balanceTransactions.list({
        created: { gte: yearStart },
        limit: 100
      }, { stripeAccount: stripeAccount.stripe_account_id }),
      
      // Recent payouts
      stripe.payouts.list({
        limit: 10
      }, { stripeAccount: stripeAccount.stripe_account_id }),
      
      // Account details
      stripe.accounts.retrieve(stripeAccount.stripe_account_id)
    ])

    // Get earnings data from our database
    const { data: royaltyPayouts } = await supabase
      .from('royalty_payouts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: revenueSplits } = await supabase
      .from('revenue_splits')
      .select('*')
      .eq('user_id', user.id)

    // Calculate earnings metrics
    const calculateEarnings = (transactions: Stripe.BalanceTransaction[]) => {
      return transactions
        .filter(txn => txn.type === 'charge' || txn.type === 'payment' || txn.type === 'transfer')
        .reduce((sum, txn) => sum + txn.net, 0) / 100
    }

    const totalEarnings = calculateEarnings(allTransactions.data)
    const thisMonthEarnings = calculateEarnings(thisMonthTransactions.data)
    const lastMonthEarnings = calculateEarnings(lastMonthTransactions.data)
    const yearToDateEarnings = calculateEarnings(yearTransactions.data)

    // Calculate balances
    const availableBalance = balance.available.reduce((sum, bal) => sum + bal.amount, 0) / 100
    const pendingBalance = balance.pending.reduce((sum, bal) => sum + bal.amount, 0) / 100

    // Calculate payout totals
    const totalPaidOut = payouts.data
      .filter(payout => payout.status === 'paid')
      .reduce((sum, payout) => sum + payout.amount, 0) / 100

    const pendingPayouts = payouts.data
      .filter(payout => payout.status === 'pending')
      .reduce((sum, payout) => sum + payout.amount, 0) / 100

    // Calculate growth metrics
    const monthlyGrowth = lastMonthEarnings > 0 
      ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 
      : 0

    // Project annual earnings based on year-to-date performance
    const monthsElapsed = new Date().getMonth() + 1
    const projectedAnnualEarnings = monthsElapsed > 0 
      ? (yearToDateEarnings / monthsElapsed) * 12 
      : 0

    // Calculate average transaction value
    const revenueTransactions = allTransactions.data.filter(
      txn => txn.type === 'charge' || txn.type === 'payment'
    )
    const averageTransactionValue = revenueTransactions.length > 0
      ? revenueTransactions.reduce((sum, txn) => sum + txn.amount, 0) / revenueTransactions.length / 100
      : 0

    // Get platform earnings from our database
    const platformEarnings = revenueSplits?.map(split => ({
      platform: split.platform_name || 'Unknown',
      earnings: split.earned_amount || 0,
      percentage: split.split_percentage || 0,
      lastUpdated: split.last_calculated_at
    })) || []

    // Calculate revenue breakdown by source
    const revenueBySource = allTransactions.data
      .filter(txn => txn.type === 'charge' || txn.type === 'payment')
      .reduce((acc: { [key: string]: number }, txn) => {
        const source = txn.description || 'Direct Payment'
        acc[source] = (acc[source] || 0) + (txn.net / 100)
        return acc
      }, {})

    const revenueBreakdown = Object.entries(revenueBySource)
      .map(([source, amount]) => ({
        source,
        amount,
        percentage: totalEarnings > 0 ? (amount / totalEarnings) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)

    // Build comprehensive earnings summary
    const earningsSummary = {
      // Account status
      stripeAccountStatus: {
        id: stripeAccount.stripe_account_id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        businessType: account.business_type,
        country: account.country,
        defaultCurrency: account.default_currency
      },

      // Current balances
      balances: {
        available: availableBalance,
        pending: pendingBalance,
        total: availableBalance + pendingBalance,
        currency: balance.available[0]?.currency || 'usd'
      },

      // Earnings overview
      earnings: {
        total: totalEarnings,
        thisMonth: thisMonthEarnings,
        lastMonth: lastMonthEarnings,
        yearToDate: yearToDateEarnings,
        projectedAnnual: projectedAnnualEarnings,
        monthlyGrowthRate: monthlyGrowth,
        averageTransactionValue
      },

      // Payout information
      payouts: {
        totalPaidOut,
        pendingPayouts,
        lastPayoutDate: payouts.data.length > 0 ? payouts.data[0].created : null,
        recentPayouts: payouts.data.slice(0, 5).map(payout => ({
          id: payout.id,
          amount: payout.amount / 100,
          status: payout.status,
          arrivalDate: payout.arrival_date,
          created: payout.created,
          currency: payout.currency
        }))
      },

      // Revenue analytics
      analytics: {
        revenueBreakdown,
        platformEarnings,
        transactionCount: revenueTransactions.length,
        averageMonthlyEarnings: monthsElapsed > 0 ? yearToDateEarnings / monthsElapsed : 0
      },

      // Recent activity
      recentTransactions: allTransactions.data.slice(0, 10).map(txn => ({
        id: txn.id,
        amount: txn.amount / 100,
        net: txn.net / 100,
        fee: txn.fee / 100,
        type: txn.type,
        description: txn.description,
        created: txn.created,
        currency: txn.currency,
        status: txn.status
      })),

      // Database records
      databaseRecords: {
        royaltyPayouts: royaltyPayouts?.length || 0,
        revenueSplits: revenueSplits?.length || 0
      },

      // Metadata
      lastUpdated: new Date().toISOString(),
      hasStripeAccount: true
    }

    return NextResponse.json({
      success: true,
      data: earningsSummary
    })

  } catch (error) {
    console.error('Error retrieving earnings summary:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve earnings summary' },
      { status: 500 }
    )
  }
}
