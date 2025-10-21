require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateDraftsToPending() {
  console.log('🔄 Updating draft releases to pending status...')
  
  // Get all draft releases
  const { data: draftReleases, error: fetchError } = await supabase
    .from('releases')
    .select('id, title, artist_name, status')
    .eq('status', 'draft')
  
  if (fetchError) {
    console.error('❌ Error fetching draft releases:', fetchError)
    return
  }
  
  console.log(`📋 Found ${draftReleases.length} draft releases:`)
  draftReleases.forEach((release, i) => {
    console.log(`${i + 1}. "${release.title}" by ${release.artist_name}`)
  })
  
  if (draftReleases.length === 0) {
    console.log('✅ No draft releases to update')
    return
  }
  
  // Update all drafts to pending
  const { data: updatedReleases, error: updateError } = await supabase
    .from('releases')
    .update({ 
      status: 'pending',
      updated_at: new Date().toISOString()
    })
    .eq('status', 'draft')
    .select('id, title, artist_name, status')
  
  if (updateError) {
    console.error('❌ Error updating releases:', updateError)
    return
  }
  
  console.log(`✅ Successfully updated ${updatedReleases.length} releases to pending status:`)
  updatedReleases.forEach((release, i) => {
    console.log(`${i + 1}. "${release.title}" by ${release.artist_name} → ${release.status}`)
  })
  
  // Verify final status distribution
  const { data: statusCheck, error: statusError } = await supabase
    .from('releases')
    .select('status')
  
  if (!statusError) {
    const statusCounts = statusCheck.reduce((acc, release) => {
      acc[release.status] = (acc[release.status] || 0) + 1
      return acc
    }, {})
    
    console.log('\n📊 Final status distribution:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count}`)
    })
  }
}

updateDraftsToPending().catch(console.error)
