import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function run() {
  console.log('Testing updated notification system...')
  
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
  
  if (!users || users.length === 0) {
    console.error('No users found')
    return
  }
  
  // Test with valid type 'success'
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: users[0].id,
      title: 'Release Approved! 🎉',
      message: 'Your release has been approved and is ready for distribution!',
      type: 'success'
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
  
  // Test via API
  console.log('Testing via notification API...')
  const notificationData = {
    user_id: users[0].id,
    title: 'API Test Notification',
    message: 'Testing notification via API endpoint',
    type: 'success'
  }
  
  try {
    const response = await fetch('http://localhost:3000/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationData)
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✓ API notification test successful:', result)
      
      // Clean up API test notification
      if (result.data && result.data.id) {
        await supabase
          .from('notifications')
          .delete()
          .eq('id', result.data.id)
        console.log('✓ API test notification cleaned up')
      }
    } else {
      console.error('API test failed:', response.status, await response.text())
    }
  } catch (apiError) {
    console.error('API test error:', apiError)
  }
}

run().catch(e => { console.error(e); process.exit(1) })
