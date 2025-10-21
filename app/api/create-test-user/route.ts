import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase client not initialized' 
      }, { status: 500 })
    }

    const testUser = {
      email: 'test@onesync.music',
      password: 'testpassword123'
    }
    
    // First check if user already exists
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', testUser.email)
    
    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test user already exists',
        credentials: testUser
      })
    }
    
    // Create new user
    const { data, error } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    })
    
    if (error) {
      console.error('Error creating test user:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test user created successfully',
      credentials: testUser,
      data 
    })
    
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ 
      success: false, 
      error: 'Unexpected error occurred' 
    }, { status: 500 })
  }
}