require('dotenv').config({ path: '.env.local' });
const { supabase } = require('./lib/supabase.ts');

async function createTestUser() {
  console.log('🔐 Creating test user...');
  
  const testEmail = 'test@onesync.com';
  const testPassword = 'TestPass123!';
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });
    
    if (error) {
      console.error('❌ Signup error:', error.message);
    } else {
      console.log('✅ Test user created successfully!');
      console.log('📧 Email:', testEmail);
      console.log('🔑 Password:', testPassword);
      console.log('👤 User ID:', data.user?.id);
    }
  } catch (err) {
    console.error('🚨 Unexpected error:', err.message);
  }
}

createTestUser();
