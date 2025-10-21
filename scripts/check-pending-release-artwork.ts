import { createAdminClient } from '@/lib/supabase/admin'

async function run() {
  const supabase = createAdminClient()
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
