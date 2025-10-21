require('dotenv').config({ path: '.env.local' });
const { supabase } = require('./lib/supabase.ts');

console.log('🔍 Testing Supabase Authentication...');
console.log('Supabase client status:', !!supabase);
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Key present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (supabase) {
  supabase.auth.getSession()
    .then(result => {
      console.log('✅ Session test successful:', !!result.data);
      console.log('Session data available:', !!result.data.session);
      
      // Test a simple sign in with invalid credentials to see if auth is working
      return supabase.auth.signInWithPassword({
        email: 'test@nonexistent.com',
        password: 'wrongpassword'
      });
    })
    .then(result => {
      console.log('❌ Expected auth error (this is good):', result.error?.message);
    })
    .catch(error => {
      console.error('🚨 Auth connection error:', error.message);
    });
} else {
  console.error('🚨 Supabase client not initialized');
}
