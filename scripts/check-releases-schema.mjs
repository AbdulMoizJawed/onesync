import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function run() {
  // First check what columns exist in releases table
  const { data: columns, error: colError } = await supabase
    .rpc('get_table_columns', { table_name: 'releases' })
    .select()
  
  if (colError) {
    console.log('Could not get column info, trying direct query...')
  } else {
    console.log('Releases table columns:', columns)
  }

  // Try to get any releases to see the schema
  const { data, error } = await supabase
    .from('releases')
    .select('*')
    .limit(3)
  
  if (error) {
    console.error('Error fetching releases:', error)
    process.exit(1)
  }
  
  if (!data || data.length === 0) {
    console.log('No releases found in table.')
    return
  }
  
  console.log('Sample release schema:')
  console.log(Object.keys(data[0]))
  console.log('\nFirst release data:')
  console.log(data[0])
}

run().catch(e => { console.error(e); process.exit(1) })
