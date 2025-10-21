import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function run() {
  console.log('Testing notifications with a real user...')
  
  // Get a real user ID
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
  
  if (userError || !users || users.length === 0) {
    console.error('No users found:', userError)
    return
  }
  
  const userId = users[0].id
  console.log('Testing with user ID:', userId)
  
  // Test creating notification with valid type
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: 'Test Release Approved',
      message: 'Your release has been approved for distribution!',
      type: 'release',
      read: false,
      metadata: { test: true }
    })
    .select()
  
  if (error) {
    console.error('Error creating notification:', error)
  } else {
    console.log('✓ Notification created successfully:', data)
    
    // Clean up
    if (data && data.length > 0) {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', data[0].id)
      console.log('✓ Test notification cleaned up')
    }
  }
}

run().catch(e => { console.error(e); process.exit(1) })
