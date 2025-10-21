// Simple env checker for Supabase keys
require('dotenv').config({ path: '.env.local' });
console.log('Loaded .env.local from', require('path').resolve('.env.local'));
console.log('NEXT_PUBLIC_SUPABASE_URL =', process.env.NEXT_PUBLIC_SUPABASE_URL ? '<present>' : '<missing>');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY =', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '<present>' : '<missing>');
console.log('SUPABASE_SERVICE_ROLE_KEY =', process.env.SUPABASE_SERVICE_ROLE_KEY ? '<present>' : '<missing>');
if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('anon key (first 40 chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 40) + '...');
}
