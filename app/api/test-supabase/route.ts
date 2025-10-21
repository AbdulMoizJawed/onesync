import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase client not initialized',
        supabaseConfigured: false
      }, { status: 500 })
    }

    // Test basic Supabase connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Supabase test error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        supabaseConfigured: !!supabase
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      supabaseConfigured: !!supabase,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('Unexpected error testing Supabase:', err)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      supabaseConfigured: !!supabase
    }, { status: 500 })
  }
}