require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAuthLogin() {
  console.log('🧪 Testing authentication after profile fix...\n');
  
  try {
    // Test sign-in with a user that previously didn't have a profile
    console.log('Testing sign-in with: aztecafro@gmail.com');
    
    // First, reset their password so we can test
    const { error: resetError } = await supabase.auth.admin.updateUserById(
      '4d5e8533-c251-4b4c-8c7f-419bc7686bfb',
      { password: 'testpass123' }
    );
    
    if (resetError) {
      console.log('❌ Error resetting password:', resetError.message);
      return;
    }
    
    console.log('✅ Password reset for aztecafro@gmail.com');
    
    // Create a new client for testing (regular client, not service role)
    const testClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Test sign in
    const { data: signInData, error: signInError } = await testClient.auth.signInWithPassword({
      email: 'aztecafro@gmail.com',
      password: 'testpass123'
    });
    
    if (signInError) {
      console.log('❌ Sign-in failed:', signInError.message);
      return;
    }
    
    console.log('✅ Sign-in successful!');
    console.log('User ID:', signInData.user?.id);
    console.log('Email:', signInData.user?.email);
    
    // Check if we can now get their profile
    const { data: profile, error: profileError } = await testClient
      .from('profiles')
      .select('*')
      .eq('id', signInData.user?.id)
      .single();
      
    if (profileError) {
      console.log('❌ Error getting profile:', profileError.message);
    } else {
      console.log('✅ Profile found:', profile.email);
      console.log('Full name:', profile.full_name);
      console.log('Role:', profile.role);
    }
    
    // Sign out
    await testClient.auth.signOut();
    console.log('✅ Signed out successfully');
    
  } catch (err) {
    console.log('❌ Exception during auth test:', err.message);
  }
}

testAuthLogin().then(() => {
  console.log('\n✅ Auth test complete');
  process.exit(0);
}).catch(err => {
  console.log('❌ Fatal error:', err.message);
  process.exit(1);
});
