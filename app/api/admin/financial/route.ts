import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days

    const periodDays = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Fetch transactions
    const { data: transactions, error } = await supabase
      .from('platform_transactions')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transactions', details: error.message },
        { status: 500 }
      )
    }

    // Calculate comprehensive stats
    const stats = {
      period: `Last ${periodDays} days`,
      totalTransactions: transactions?.length || 0,
      
      // Revenue breakdown
      totalRevenue: transactions
        ?.filter(t => ['purchase', 'subscription'].includes(t.transaction_type))
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0,
      
      totalPlatformFees: transactions
        ?.reduce((sum, t) => sum + parseFloat(t.platform_fee || 0), 0) || 0,
      
      netRevenue: transactions
        ?.reduce((sum, t) => sum + parseFloat(t.net_amount || 0), 0) || 0,
      
      // By transaction type
      byType: {
        purchases: transactions?.filter(t => t.transaction_type === 'purchase').length || 0,
        payouts: transactions?.filter(t => t.transaction_type === 'payout').length || 0,
        refunds: transactions?.filter(t => t.transaction_type === 'refund').length || 0,
        subscriptions: transactions?.filter(t => t.transaction_type === 'subscription').length || 0,
        commissions: transactions?.filter(t => t.transaction_type === 'commission').length || 0,
      },
      
      // Revenue by service category
      byServiceCategory: {
        beat_purchase: transactions
          ?.filter(t => t.service_category === 'beat_purchase')
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0,
        
        playlist_campaign: transactions
          ?.filter(t => t.service_category === 'playlist_campaign')
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0,
        
        mastering: transactions
          ?.filter(t => t.service_category === 'mastering')
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0,
        
        promo_services: transactions
          ?.filter(t => t.service_category === 'promo_services')
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0,
        
        other: transactions
          ?.filter(t => t.service_category === 'other' || !t.service_category)
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0,
      },
      
      // Status breakdown
      byStatus: {
        completed: transactions?.filter(t => t.status === 'completed').length || 0,
        pending: transactions?.filter(t => t.status === 'pending').length || 0,
        failed: transactions?.filter(t => t.status === 'failed').length || 0,
        refunded: transactions?.filter(t => t.status === 'refunded').length || 0,
      },
      
      // Average transaction value
      averageTransaction: transactions?.length
        ? (transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) / transactions.length).toFixed(2)
        : 0,
      
      // Top revenue days
      dailyRevenue: getDailyRevenue(transactions || [])
    }

    return NextResponse.json({ 
      transactions: transactions || [],
      stats,
      success: true 
    })
  } catch (error) {
    console.error('Admin financial error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial data' },
      { status: 500 }
    )
  }
}

function getDailyRevenue(transactions: any[]) {
  const dailyMap = new Map()
  
  transactions.forEach(t => {
    const date = new Date(t.created_at).toISOString().split('T')[0]
    const current = dailyMap.get(date) || 0
    dailyMap.set(date, current + parseFloat(t.amount || 0))
  })
  
  return Array.from(dailyMap.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30)
}
