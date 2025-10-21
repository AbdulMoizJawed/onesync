import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkReleaseQueue() {
  console.log('Checking release queue...')
  
  // Get all pending releases
  const { data: releases, error } = await supabase
    .from('releases')
    .select('id, title, artist_name, cover_art_url, artwork_url, status, user_id')
    .eq('status', 'pending')
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`Found ${releases?.length || 0} pending releases:`)
  releases?.forEach(release => {
    console.log(`- ${release.title} by ${release.artist_name}`)
    console.log(`  ID: ${release.id}`)
    console.log(`  User ID: ${release.user_id}`)
    console.log(`  Cover Art: ${release.cover_art_url || 'None'}`)
    console.log(`  Artwork: ${release.artwork_url || 'None'}`)
    console.log(`  Status: ${release.status}`)
    console.log('')
  })

  // Check if profiles table exists and get some user data
  try {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .limit(1)
    
    if (profileError) {
      console.log('Profiles table error:', profileError.message)
    } else {
      console.log('Profiles table accessible, sample:', profiles?.[0])
    }
  } catch (err) {
    console.log('Profiles table might not exist')
  }
}

checkReleaseQueue()
