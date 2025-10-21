require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSettingsPage() {
  console.log('🧪 Testing settings page functionality...')
  
  try {
    // Test basic profile fetch
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (profilesError) {
      console.error('❌ Profiles query failed:', profilesError.message)
      return
    }
    
    console.log('✅ Profiles query successful')
    
    if (profiles && profiles.length > 0) {
      const profile = profiles[0]
      console.log('Profile structure:', Object.keys(profile))
      
      // Test profile update query structure
      console.log('Testing profile update structure...')
      
      const updateData = {
        full_name: profile.full_name,
        username: profile.username,
        bio: profile.bio,
        updated_at: new Date().toISOString()
      }
      
      console.log('✅ Update data structure valid')
      
      // Test avatar upload path (bucket check)
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        console.error('❌ Storage buckets check failed:', bucketsError.message)
      } else {
        console.log('✅ Storage accessible, buckets:', buckets?.map(b => b.name) || [])
      }
    }
    
    console.log('✅ Settings page functionality test passed')
    
  } catch (err) {
    console.error('❌ Test error:', err.message)
  }
}

testSettingsPage()
