import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function run() {
  // Check what the valid status values are by querying the constraint
  const { data, error } = await supabase
    .rpc('get_table_constraints', { table_name: 'releases' })
    .select()
  
  if (error) {
    console.log('Could not get constraint info, checking existing statuses...')
    
    // Get unique status values from existing releases
    const { data: statuses, error: statusError } = await supabase
      .from('releases')
      .select('status')
      .not('status', 'is', null)
    
    if (statusError) {
      console.error('Error getting statuses:', statusError)
    } else {
      const uniqueStatuses = [...new Set(statuses.map(r => r.status))]
      console.log('Existing status values in releases table:', uniqueStatuses)
    }
  } else {
    console.log('Table constraints:', data)
  }
}

run().catch(e => { console.error(e); process.exit(1) })
