const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixRolesSystem() {
  console.log('🔧 FIXING ROLES SYSTEM...\n');

  try {
    // Step 1: Check current profiles table structure
    console.log('1. Checking profiles table structure...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError);
      return;
    }

    const columns = Object.keys(profiles[0] || {});
    console.log('✅ Profiles columns:', columns);
    
    const hasRoleColumn = columns.includes('role');
    console.log(`✅ Role column exists: ${hasRoleColumn}\n`);

    // Step 2: Set up admin users
    console.log('2. Setting up admin users...');
    const adminEmails = [
      'info@onesync.music',
      'support@onesync.music',
      'admin@onesync.music',
      'miles@onesync.music'
    ];

    for (const email of adminEmails) {
      console.log(`   Checking user: ${email}`);
      
      // First, check if user exists in auth.users
      const { data: authUsers, error: authError } = await supabase
        .rpc('get_auth_user_by_email', { user_email: email });
      
      if (authError) {
        console.log(`   ⚠️  Cannot check auth user: ${authError.message}`);
      }

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.log(`   ❌ Error checking profile: ${profileError.message}`);
        continue;
      }

      if (profile) {
        console.log(`   📝 Found profile for ${email}, current role: ${profile.role || 'none'}`);
        
        // Update role to admin if not already set
        if (profile.role !== 'admin') {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('email', email);

          if (updateError) {
            console.log(`   ❌ Failed to update role: ${updateError.message}`);
          } else {
            console.log(`   ✅ Updated ${email} to admin role`);
          }
        } else {
          console.log(`   ✅ ${email} already has admin role`);
        }
      } else {
        console.log(`   ⚠️  No profile found for ${email} - user may need to sign up first`);
      }
    }

    // Step 3: Set default role for users without roles
    console.log('\n3. Setting default roles for users...');
    const { data: usersWithoutRoles, error: noRoleError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .is('role', null);

    if (noRoleError) {
      console.error('❌ Error finding users without roles:', noRoleError);
    } else {
      console.log(`   Found ${usersWithoutRoles?.length || 0} users without roles`);
      
      if (usersWithoutRoles && usersWithoutRoles.length > 0) {
        const { error: defaultRoleError } = await supabase
          .from('profiles')
          .update({ role: 'user' })
          .is('role', null);

        if (defaultRoleError) {
          console.error('❌ Failed to set default roles:', defaultRoleError);
        } else {
          console.log(`   ✅ Set default 'user' role for ${usersWithoutRoles.length} users`);
        }
      }
    }

    // Step 4: Create role check function if it doesn't exist
    console.log('\n4. Setting up role check functions...');
    
    const roleCheckFunction = `
      CREATE OR REPLACE FUNCTION public.is_admin(user_email text)
      RETURNS boolean AS $$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE email = user_email 
          AND role = 'admin'
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error: functionError } = await supabase.rpc('exec_sql', { 
      sql: roleCheckFunction 
    });

    if (functionError) {
      console.log('   ⚠️  Could not create role function (may already exist)');
    } else {
      console.log('   ✅ Created role check function');
    }

    // Step 5: Verify admin access
    console.log('\n5. Verifying admin access...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('email, role, created_at')
      .eq('role', 'admin');

    if (adminError) {
      console.error('❌ Error checking admin users:', adminError);
    } else {
      console.log('✅ Admin users found:');
      adminUsers?.forEach(user => {
        console.log(`   - ${user.email} (created: ${new Date(user.created_at).toLocaleDateString()})`);
      });
    }

    // Step 6: Test role evaluation
    console.log('\n6. Testing role evaluation logic...');
    const testEmails = ['info@onesync.music', 'test@example.com'];
    
    for (const email of testEmails) {
      const domainOk = email.endsWith('@onesync.music');
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', email)
        .single();
      
      const dbRoleOk = userProfile?.role === 'admin';
      const isAdmin = domainOk || dbRoleOk;
      
      console.log(`   ${email}: domain=${domainOk}, dbRole=${dbRoleOk}, isAdmin=${isAdmin}`);
    }

    console.log('\n✅ ROLES SYSTEM FIX COMPLETED!');
    console.log('\nNext steps:');
    console.log('1. Add ADMIN_EMAILS to .env.local');
    console.log('2. Test admin access at /admin');
    console.log('3. Verify user roles are working correctly');

  } catch (error) {
    console.error('❌ Role system fix failed:', error);
  }
}

// Execute if run directly
if (require.main === module) {
  fixRolesSystem();
}

module.exports = { fixRolesSystem };
