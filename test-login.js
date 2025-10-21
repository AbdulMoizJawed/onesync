require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey);

async function testLogin() {
  console.log('🔍 Testing login functionality...');
  
  // Test credentials - we'll try with a common test password
  const testCredentials = [
    { email: 'biz4miles@gmail.com', password: 'testpass123' },
    { email: 'info@onesync.music', password: 'testpass123' },
    { email: 'milesgaines0002@gmail.com', password: 'testpass123' }
  ];
  
  for (const creds of testCredentials) {
    console.log(`\n🔐 Testing login for: ${creds.email}`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password
      });
      
      if (error) {
        console.log(`❌ Login failed: ${error.message}`);
      } else if (data.user) {
        console.log(`✅ Login successful!`);
        console.log(`   User ID: ${data.user.id}`);
        console.log(`   Email: ${data.user.email}`);
        
        // Test session
        const { data: session } = await supabase.auth.getSession();
        console.log(`   Session active: ${session.session ? 'Yes' : 'No'}`);
        
        // Sign out after test
        await supabase.auth.signOut();
        console.log(`   Signed out for test`);
        return; // Exit after first successful login
      }
    } catch (err) {
      console.log(`❌ Error testing ${creds.email}: ${err.message}`);
    }
  }
  
  console.log('\n❌ No successful logins with test password');
}
