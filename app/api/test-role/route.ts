import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing role system API...')
    
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Supabase not available',
        supabaseAvailable: false
      }, { status: 500 })
    }
    
    // Test if we can read profiles with role column
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(3)
    
    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message,
        supabaseAvailable: true
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      supabaseAvailable: true,
      profilesFound: profiles?.length || 0,
      profiles: profiles?.map((p: any) => ({ id: p.id, email: p.email, role: p.role })),
      message: 'Role system is working correctly'
    })
  } catch (error) {
    console.error('💥 Exception in role test:', error)
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      supabaseAvailable: !!supabase
    }, { status: 500 })
  }
}
