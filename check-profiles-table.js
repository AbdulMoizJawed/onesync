require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProfilesTable() {
  console.log('🔍 Checking profiles table structure...')
  
  try {
    // Try to get one profile to see structure
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error querying profiles table:', error.message)
      return
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️ No data in profiles table')
      return
    }
    
    console.log('✅ Profiles table columns:', Object.keys(data[0]))
    
    // Check specifically for forum_privacy column
    const { data: privacyData, error: privacyError } = await supabase
      .from('profiles')
      .select('forum_privacy')
      .limit(1)
    
    if (privacyError) {
      console.log('❌ forum_privacy column missing:', privacyError.message)
    } else {
      console.log('✅ forum_privacy column exists')
    }
    
  } catch (err) {
    console.error('❌ Script error:', err.message)
  }
}

checkProfilesTable()
