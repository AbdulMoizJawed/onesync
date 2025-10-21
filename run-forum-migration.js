const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runMigration() {
  console.log('🔄 Running forum privacy migration...')
  
  try {
    // Try to update existing profiles first (this will work if columns exist)
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, forum_privacy')
      .limit(1)

    if (fetchError && fetchError.message.includes('forum_privacy')) {
      console.log('❌ forum_privacy column does not exist')
      console.log('📝 Please run this SQL manually in Supabase dashboard:')
      console.log(`
ALTER TABLE profiles 
ADD COLUMN forum_privacy JSONB DEFAULT '{
  "use_real_name": false,
  "show_avatar": true,
  "show_bio": false,
  "use_separate_forum_avatar": false,
  "forum_avatar_url": null,
  "forum_display_name": null
}'::jsonb;

ALTER TABLE profiles 
ADD COLUMN forum_settings JSONB DEFAULT '{
  "email_notifications": true,
  "mention_notifications": true,
  "auto_subscribe_posts": false,
  "show_online_status": false
}'::jsonb;

UPDATE profiles 
SET 
  forum_privacy = '{
    "use_real_name": false,
    "show_avatar": true,
    "show_bio": false,
    "use_separate_forum_avatar": false,
    "forum_avatar_url": null,
    "forum_display_name": null
  }'::jsonb,
  forum_settings = '{
    "email_notifications": true,
    "mention_notifications": true,
    "auto_subscribe_posts": false,
    "show_online_status": false
  }'::jsonb,
  updated_at = NOW()
WHERE forum_privacy IS NULL;
      `)
    } else {
      console.log('✅ forum_privacy column already exists')
    }

  } catch (error) {
    console.error('Migration check failed:', error)
  }
}

runMigration()
