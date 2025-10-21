// Test user creation utility
// Run this in the browser console or create an API endpoint

import { supabase } from '@/lib/supabase'

export async function createTestUser() {
  const testUser = {
    email: 'test@onesync.music',
    password: 'testpassword123'
  }
  
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' }
    }

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
      return { success: false, error: error.message }
    }
    
    console.log('Test user created successfully:', data)
    return { success: true, data }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Test user credentials for login:
// Email: test@onesync.music  
// Password: testpassword123