require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testForumProfile() {
  console.log('🧪 Testing forum profile fallback logic...')
  
  try {
    // Get a test user ID
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (usersError || !users || users.length === 0) {
      console.error('❌ No users found for testing')
      return
    }
    
    const testUserId = users[0].id
    console.log('Using test user ID:', testUserId)
    
    // Try the query that should fail
    console.log('🔍 Testing query with forum_privacy column...')
    const { data: profilesWithPrivacy, error: privacyError } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, bio, forum_privacy')
      .eq('id', testUserId)
    
    if (privacyError) {
      console.log('❌ Query with forum_privacy failed:', privacyError.message)
      
      if (privacyError.message?.includes('column "forum_privacy" does not exist') || privacyError.message?.includes('column profiles.forum_privacy does not exist')) {
        console.log('✅ Error detection working - falling back to basic query')
        
        // Test fallback query
        const { data: basicProfiles, error: basicError } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, bio')
          .eq('id', testUserId)
        
        if (basicError) {
          console.error('❌ Basic query also failed:', basicError.message)
        } else {
          console.log('✅ Basic query successful:', basicProfiles?.[0] ? 'Got profile data' : 'No data')
          if (basicProfiles?.[0]) {
            console.log('Profile keys:', Object.keys(basicProfiles[0]))
          }
        }
      }
    } else {
      console.log('✅ Query with forum_privacy succeeded (column exists)')
    }
    
  } catch (err) {
    console.error('❌ Test error:', err.message)
  }
}

testForumProfile()
