import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function run() {
  console.log('Checking notifications table schema...')
  
  // Try to select from notifications to see what columns exist
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error querying notifications:', error)
  } else {
    console.log('Notifications table exists with sample data:', data)
  }
  
  // Try a basic insert without metadata
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
  
  if (users && users.length > 0) {
    const { data: insertData, error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: users[0].id,
        title: 'Test Notification',
        message: 'Testing basic notification',
        type: 'release'
      })
      .select()
    
    if (insertError) {
      console.error('Error with basic insert:', insertError)
    } else {
      console.log('✓ Basic notification insert works:', insertData)
      
      // Clean up
      if (insertData && insertData.length > 0) {
        await supabase
          .from('notifications')
          .delete()
          .eq('id', insertData[0].id)
        console.log('✓ Cleaned up test notification')
      }
    }
  }
}

run().catch(e => { console.error(e); process.exit(1) })
