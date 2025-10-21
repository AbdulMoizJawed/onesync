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
    const serviceType = searchParams.get('service_type')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('ai_service_usage')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (serviceType && serviceType !== 'all') {
      query = query.eq('service_type', serviceType)
    }

    const { data: usage, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch AI service usage', details: error.message },
        { status: 500 }
      )
    }

    // Calculate stats
    const stats = {
      total: usage?.length || 0,
      totalCost: usage?.reduce((sum, u) => sum + (u.cost_estimate || 0), 0) || 0,
      successRate: usage?.length 
        ? (usage.filter(u => u.success).length / usage.length * 100).toFixed(2)
        : 0,
      byService: {
        artwork_generation: usage?.filter(u => u.service_type === 'artwork_generation').length || 0,
        video_generation: usage?.filter(u => u.service_type === 'video_generation').length || 0,
        mastering: usage?.filter(u => u.service_type === 'mastering').length || 0,
        other: usage?.filter(u => u.service_type === 'other').length || 0,
      },
      costByService: {
        artwork_generation: usage?.filter(u => u.service_type === 'artwork_generation').reduce((sum, u) => sum + (u.cost_estimate || 0), 0) || 0,
        video_generation: usage?.filter(u => u.service_type === 'video_generation').reduce((sum, u) => sum + (u.cost_estimate || 0), 0) || 0,
        mastering: usage?.filter(u => u.service_type === 'mastering').reduce((sum, u) => sum + (u.cost_estimate || 0), 0) || 0,
        other: usage?.filter(u => u.service_type === 'other').reduce((sum, u) => sum + (u.cost_estimate || 0), 0) || 0,
      }
    }

    return NextResponse.json({ 
      usage: usage || [],
      stats,
      success: true 
    })
  } catch (error) {
    console.error('Admin AI services error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI service usage' },
      { status: 500 }
    )
  }
}
