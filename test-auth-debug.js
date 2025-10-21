// Auth System Debug Test
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Auth System Diagnostic:');
console.log('Environment loaded from .env.local');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const { supabase, hasValidSupabaseConfig } = require('./lib/supabase.ts');

console.log('🔍 Auth System Diagnostic:');
console.log('Has valid Supabase config:', hasValidSupabaseConfig());
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase client exists:', !!supabase);

if (supabase) {
  console.log('✅ Supabase client initialized successfully');
  
  // Test auth session
  supabase.auth.getSession().then(({ data, error }) => {
    console.log('Current session data:', data);
    if (error) {
      console.error('❌ Session error:', error);
    } else {
      console.log('✅ Session check successful');
    }
  }).catch(err => {
    console.error('❌ Failed to get session:', err);
  });
  
} else {
  console.error('❌ Supabase client not initialized');
}
