const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addShortUrlColumn() {
  try {
    console.log('Checking if short_url column exists in promo_pages table...')
    
    // First, let's check the current table structure
    const { data, error } = await supabase
      .from('promo_pages')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Error checking table:', error)
      return
    }
    
    console.log('Current table structure:', Object.keys(data[0] || {}))
    
    // Check if short_url column exists
    if (data[0] && !data[0].hasOwnProperty('short_url')) {
      console.log('Adding short_url column...')
      
      // Use RPC to add the column
      const { data: result, error: rpcError } = await supabase
        .rpc('exec_sql', { 
          sql: 'ALTER TABLE promo_pages ADD COLUMN short_url TEXT;' 
        })
      
      if (rpcError) {
        console.error('Error adding column:', rpcError)
        // Try direct SQL execution
        console.log('Trying alternative method...')
        console.log('Please run this SQL manually in Supabase:')
        console.log('ALTER TABLE promo_pages ADD COLUMN short_url TEXT;')
      } else {
        console.log('✅ Successfully added short_url column')
      }
    } else {
      console.log('✅ short_url column already exists')
    }
    
  } catch (error) {
    console.error('Script error:', error)
  }
}

addShortUrlColumn()
