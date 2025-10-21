require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkReleaseColumns() {
  console.log('🔍 Checking releases table columns...')
  
  // Get one release to see all columns
  const { data: releases, error } = await supabase
    .from('releases')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  if (releases && releases.length > 0) {
    console.log('📋 Available columns:')
    Object.keys(releases[0]).forEach(column => {
      console.log(`  - ${column}`)
    })
  }
}

checkReleaseColumns().catch(console.error)
