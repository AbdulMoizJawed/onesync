const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    // Test basic connection
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Supabase connection error:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful')
    console.log('Session data:', data ? 'Available' : 'No active session')
    
    // Test database connection
    const { data: testData, error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (dbError) {
      console.log('ℹ️ Database query result:', dbError.message)
      console.log('   (This might be normal if table doesn\'t exist)')
    } else {
      console.log('✅ Database connection successful')
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Supabase test failed:', error.message)
    return false
  }
}

testSupabaseConnection()
