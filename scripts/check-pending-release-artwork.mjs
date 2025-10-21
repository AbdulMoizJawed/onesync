import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function run() {
  const { data, error } = await supabase
    .from('releases')
    .select('id,title,cover_art_url,artwork_url,status,created_at')
    .eq('status','pending')
    .order('created_at', { ascending: false })
    .limit(25)
  if (error) {
    console.error('Error fetching releases:', error)
    process.exit(1)
  }
  if (!data || data.length === 0) {
    console.log('No pending releases found.')
    return
  }
  console.table(data.map(r => ({ id: r.id, title: r.title, cover_art_url: r.cover_art_url, artwork_url: r.artwork_url })))
}

run().catch(e => { console.error(e); process.exit(1) })
