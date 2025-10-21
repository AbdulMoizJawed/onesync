// Quick diagnostic for Supabase configuration
require('dotenv').config({ path: '.env.local' })

console.log('🔍 Checking Supabase Configuration...\n')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('NEXT_PUBLIC_SUPABASE_URL:', url ? `✅ ${url.substring(0, 30)}...` : '❌ MISSING')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', key ? `✅ ${key.substring(0, 30)}...` : '❌ MISSING')

if (!url || !key) {
  console.log('\n❌ ERROR: Supabase environment variables are not set!')
  console.log('\nCreate a .env.local file with:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key')
  process.exit(1)
}

console.log('\n✅ Supabase configuration looks good!')

