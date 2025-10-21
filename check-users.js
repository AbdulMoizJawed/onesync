require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.log('❌ No service key found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkUsers() {
  try {
    console.log('🔍 Checking existing users...');
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    if (users.users.length === 0) {
      console.log('📝 No users found in database');
    } else {
      console.log('👥 Found users:');
      users.users.forEach((user, i) => {
        console.log(`  ${i + 1}. ${user.email} (ID: ${user.id})`);
        console.log(`     Created: ${user.created_at}`);
        console.log(`     Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      });
    }
  } catch (err) {
    console.log('❌ Error checking users:', err.message);
  }
}

checkUsers();
