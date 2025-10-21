require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createMissingProfiles() {
  console.log('🔧 Creating missing profile records...\n');
  
  try {
    // Get auth users without profiles
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.log('❌ Error getting auth users:', authError.message);
      return;
    }
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');
      
    if (profilesError) {
      console.log('❌ Error getting profiles:', profilesError.message);
      return;
    }
    
    const profileIds = new Set(profiles.map(p => p.id));
    const usersWithoutProfiles = authUsers.users.filter(u => !profileIds.has(u.id));
    
    console.log(`📊 Found ${usersWithoutProfiles.length} users without profiles\n`);
    
    if (usersWithoutProfiles.length === 0) {
      console.log('✅ All users already have profiles!');
      return;
    }
    
    // Create profiles for users without them
    for (const user of usersWithoutProfiles) {
      console.log(`Creating profile for: ${user.email}`);
      
      const profileData = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: user.email.endsWith('@onesync.music') ? 'admin' : 'user'
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData);
        
      if (error) {
        console.log(`❌ Failed to create profile for ${user.email}:`, error.message);
      } else {
        console.log(`✅ Created profile for ${user.email}`);
      }
    }
    
    console.log('\n🎉 Profile creation complete!');
    
    // Verify all users now have profiles
    const { data: updatedProfiles, error: verifyError } = await supabase
      .from('profiles')
      .select('id');
      
    if (!verifyError) {
      const updatedProfileIds = new Set(updatedProfiles.map(p => p.id));
      const stillMissing = authUsers.users.filter(u => !updatedProfileIds.has(u.id));
      
      console.log(`\n📊 Verification: ${stillMissing.length} users still missing profiles`);
      
      if (stillMissing.length === 0) {
        console.log('🎉 SUCCESS: All auth users now have matching profiles!');
      }
    }
    
  } catch (err) {
    console.log('❌ Exception during profile creation:', err.message);
  }
}

createMissingProfiles().then(() => {
  console.log('\n✅ Profile creation script complete');
  process.exit(0);
}).catch(err => {
  console.log('❌ Fatal error:', err.message);
  process.exit(1);
});
