import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function run() {
  console.log('Checking current status constraint...')
  
  // Try to update a release to see what constraint errors we get
  const { data: releases } = await supabase
    .from('releases')
    .select('id')
    .limit(1)
  
  if (!releases || releases.length === 0) {
    console.log('No releases to test with')
    return
  }
  
  // Try updating to 'approved' status
  console.log('Testing approved status...')
  const { error: approvedError } = await supabase
    .from('releases')
    .update({ status: 'approved' })
    .eq('id', releases[0].id)
  
  if (approvedError) {
    console.log('Approved status error:', approvedError)
  } else {
    console.log('✓ Approved status works')
  }
  
  // Try updating to 'distributed' status
  console.log('Testing distributed status...')
  const { error: distributedError } = await supabase
    .from('releases')
    .update({ status: 'distributed' })
    .eq('id', releases[0].id)
  
  if (distributedError) {
    console.log('Distributed status error:', distributedError)
  } else {
    console.log('✓ Distributed status works')
  }
  
  // Revert back to pending
  await supabase
    .from('releases')
    .update({ status: 'pending' })
    .eq('id', releases[0].id)
}

run().catch(e => { console.error(e); process.exit(1) })
