require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function addForumPrivacyColumn() {
  console.log('🔄 Adding forum_privacy column to profiles table...')
  
  try {
    // First, let's try to add the column directly using SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS forum_privacy JSONB DEFAULT '{
          "use_real_name": false,
          "show_avatar": true,
          "show_bio": false,
          "use_separate_forum_avatar": false,
          "forum_avatar_url": null,
          "forum_display_name": null
        }'::jsonb;
      `
    })
    
    if (error) {
      console.error('❌ exec_sql failed:', error.message)
      console.log('📝 Note: You may need to run this migration manually in Supabase dashboard')
      console.log('SQL to run:')
      console.log(`
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS forum_privacy JSONB DEFAULT '{
  "use_real_name": false,
  "show_avatar": true,
  "show_bio": false,
  "use_separate_forum_avatar": false,
  "forum_avatar_url": null,
  "forum_display_name": null
}'::jsonb;
      `)
    } else {
      console.log('✅ forum_privacy column added successfully')
    }
    
    // Test the column now exists
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('forum_privacy')
      .limit(1)
    
    if (testError) {
      console.log('❌ Column test failed:', testError.message)
    } else {
      console.log('✅ forum_privacy column is now accessible')
    }
    
  } catch (err) {
    console.error('❌ Script error:', err.message)
  }
}

addForumPrivacyColumn()
