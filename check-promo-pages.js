require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPromoPages() {
  console.log('Checking promo pages...')
  
  // First check without joins
  const { data: promoPages, error } = await supabase
    .from('promo_pages')
    .select('*')
    .limit(3)
  
  if (error) {
    console.error('Error fetching promo pages:', error)
    return
  }
  
  console.log(`Found ${promoPages?.length || 0} promo pages:`)
  if (promoPages && promoPages.length > 0) {
    for (const page of promoPages) {
      console.log(`\n- ${page.title} (slug: ${page.slug}) - Active: ${page.is_active}`)
      console.log(`  URL: http://localhost:3001/promo/${page.slug}`)
      console.log(`  User ID: ${page.user_id}`)
      console.log(`  Bio: ${page.bio || 'No bio'}`)
      console.log(`  Social Links: ${JSON.stringify(page.social_links)}`)
      
      // Try to fetch profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', page.user_id)
        .single()
        
      console.log(`  Profile: ${profile?.display_name || 'No profile found'}`)
    }
  } else {
    console.log('No promo pages found!')
  }
}

checkPromoPages()
