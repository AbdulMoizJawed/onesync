// debug-releases.js
// Ye script releases ko check karega aur problem batayega

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function debugReleases() {
  console.clear()
  console.log('🔍 RELEASES DEBUG TOOL')
  console.log('='.repeat(60))
  console.log('')

  // Initialize Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  try {
    // Step 1: Check if we can connect to Supabase
    console.log('📡 Step 1: Testing Supabase connection...')
    const { data: testData, error: testError } = await supabase
      .from('releases')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.log('❌ Cannot connect to Supabase!')
      console.log('   Error:', testError.message)
      return
    }
    console.log('✅ Supabase connected\n')

    // Step 2: Get current logged-in user
    console.log('👤 Step 2: Checking current user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('❌ No user logged in!')
      console.log('   You need to login first')
      console.log('\n💡 Solution: Go to http://localhost:3000/auth/login')
      return
    }
    
    console.log('✅ User logged in:')
    console.log(`   User ID: ${user.id}`)
    console.log(`   Email: ${user.email}\n`)

    // Step 3: Check total releases in database (any user)
    console.log('📊 Step 3: Checking ALL releases in database...')
    const { data: allReleases, error: allError, count: totalCount } = await supabase
      .from('releases')
      .select('*', { count: 'exact' })
    
    if (allError) {
      console.log('❌ Error fetching releases:', allError.message)
      return
    }
    
    console.log(`✅ Total releases in database: ${totalCount || 0}`)
    
    if (totalCount === 0) {
      console.log('\n⚠️  DATABASE IS EMPTY!')
      console.log('\n💡 Solution:')
      console.log('   1. Go to: http://localhost:3000/upload')
      console.log('   2. Upload a test release')
      console.log('   3. Run this script again\n')
      return
    }
    console.log('')

    // Step 4: Check releases for current user
    console.log('🎵 Step 4: Checking YOUR releases...')
    const { data: userReleases, error: userReleasesError } = await supabase
      .from('releases')
      .select('*')
      .eq('user_id', user.id)
    
    if (userReleasesError) {
      console.log('❌ Error:', userReleasesError.message)
      return
    }
    
    if (!userReleases || userReleases.length === 0) {
      console.log('❌ You have 0 releases!')
      console.log('\n📋 But database has releases from other users:')
      
      // Show first 5 releases from database
      allReleases?.slice(0, 5).forEach((release, i) => {
        console.log(`\n   ${i + 1}. ${release.title}`)
        console.log(`      User ID: ${release.user_id}`)
        console.log(`      Your ID: ${user.id}`)
        console.log(`      Match: ${release.user_id === user.id ? '✅' : '❌'}`)
      })
      
      console.log('\n💡 Solution:')
      console.log('   Upload a release with YOUR account')
      console.log('   Go to: http://localhost:3000/upload\n')
      return
    }
    
    console.log(`✅ You have ${userReleases.length} release(s)!\n`)
    
    // Step 5: Show release details
    console.log('📋 Step 5: Your Release Details:')
    console.log('='.repeat(60))
    
    userReleases.forEach((release, i) => {
      console.log(`\n${i + 1}. ${release.title}`)
      console.log(`   Artist: ${release.artist_name || 'N/A'}`)
      console.log(`   Status: ${release.status || 'N/A'}`)
      console.log(`   Created: ${new Date(release.created_at).toLocaleString()}`)
      console.log(`   Cover Art: ${release.cover_art_url ? '✅ Yes' : '❌ No'}`)
      console.log(`   Audio: ${release.audio_url ? '✅ Yes' : '❌ No'}`)
    })
    console.log('')

    // Step 6: Check table structure
    console.log('🔧 Step 6: Checking table columns...')
    if (userReleases[0]) {
      const columns = Object.keys(userReleases[0])
      console.log('✅ Available columns:')
      columns.forEach(col => console.log(`   - ${col}`))
    }
    console.log('')

    // Step 7: Test the exact query from artist-tools
    console.log('🧪 Step 7: Testing artist-tools query...')
    const { data: testQuery, error: testQueryError } = await supabase
      .from('releases')
      .select('id, title, artist_name, cover_art_url, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (testQueryError) {
      console.log('❌ Query failed:', testQueryError.message)
      return
    }
    
    console.log(`✅ Query successful! Found ${testQuery?.length || 0} releases`)
    console.log('')

    // Final Summary
    console.log('='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Database has ${totalCount} total releases`)
    console.log(`✅ You have ${userReleases.length} releases`)
    console.log(`✅ Query returns ${testQuery?.length || 0} releases`)
    
    if (userReleases.length > 0 && testQuery && testQuery.length > 0) {
      console.log('\n🎉 EVERYTHING IS WORKING!')
      console.log('\n💡 If artist-tools page still shows empty:')
      console.log('   1. Check browser console for errors')
      console.log('   2. Make sure you\'re logged in with same account')
      console.log('   3. Try hard refresh (Ctrl+Shift+R)')
    } else if (userReleases.length === 0) {
      console.log('\n⚠️  YOU NEED TO UPLOAD A RELEASE')
      console.log('   Go to: http://localhost:3000/upload')
    }
    console.log('')

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

debugReleases()