const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class RoleManager {
  async assignRole(email, role = 'user') {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('email', email)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        console.log(`✅ Assigned role '${role}' to ${email}`);
        return { success: true, data: data[0] };
      } else {
        console.log(`❌ User ${email} not found`);
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error(`❌ Failed to assign role to ${email}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async getUserRole(email) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .eq('email', email)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error(`❌ Failed to get user role for ${email}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async listUsersByRole(role = null) {
    try {
      let query = supabase
        .from('profiles')
        .select('id, email, role, full_name, created_at')
        .order('created_at', { ascending: false });

      if (role) {
        query = query.eq('role', role);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error(`❌ Failed to list users:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async createAdminUser(email, fullName = null) {
    try {
      // Check if profile already exists
      const existingUser = await this.getUserRole(email);
      
      if (existingUser.success) {
        console.log(`⚠️  User ${email} already exists with role: ${existingUser.data.role}`);
        
        if (existingUser.data.role !== 'admin') {
          return await this.assignRole(email, 'admin');
        } else {
          return { success: true, data: existingUser.data, message: 'Already admin' };
        }
      }

      // For creating new users, they would need to sign up first
      console.log(`⚠️  User ${email} does not exist. They need to sign up first.`);
      return { 
        success: false, 
        error: 'User must sign up through the authentication system first' 
      };

    } catch (error) {
      console.error(`❌ Failed to create admin user ${email}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async validateRoleSystem() {
    console.log('🔍 VALIDATING ROLE SYSTEM...\n');

    try {
      // Test 1: Check table structure
      console.log('1. Checking profiles table structure...');
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (error) throw error;

      const columns = Object.keys(profiles[0] || {});
      const hasRoleColumn = columns.includes('role');
      console.log(`   ✅ Role column exists: ${hasRoleColumn}`);

      if (!hasRoleColumn) {
        console.log('   ❌ Role column missing - run database migration');
        return false;
      }

      // Test 2: Check admin users
      console.log('\n2. Checking admin users...');
      const admins = await this.listUsersByRole('admin');
      if (admins.success) {
        console.log(`   ✅ Found ${admins.data.length} admin users:`);
        admins.data.forEach(admin => {
          console.log(`      - ${admin.email} (created: ${new Date(admin.created_at).toLocaleDateString()})`);
        });
      }

      // Test 3: Test role assignment
      console.log('\n3. Testing role assignment...');
      const testEmail = 'info@onesync.music';
      const roleTest = await this.getUserRole(testEmail);
      if (roleTest.success) {
        console.log(`   ✅ ${testEmail} role: ${roleTest.data.role}`);
      } else {
        console.log(`   ⚠️  ${testEmail} not found`);
      }

      // Test 4: Check environment variables
      console.log('\n4. Checking environment configuration...');
      const adminEmails = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
      const emailList = adminEmails.split(',').map(e => e.trim()).filter(Boolean);
      console.log(`   ✅ Admin emails configured: ${emailList.length > 0 ? emailList.join(', ') : 'None'}`);

      console.log('\n✅ ROLE SYSTEM VALIDATION COMPLETE');
      return true;

    } catch (error) {
      console.error('❌ Role system validation failed:', error);
      return false;
    }
  }
}

const roleManager = new RoleManager();

// CLI interface when run directly
if (require.main === module) {
  const command = process.argv[2];
  const email = process.argv[3];
  const role = process.argv[4] || 'user';

  switch (command) {
    case 'assign':
      if (!email) {
        console.log('Usage: node role-manager.js assign <email> [role]');
        process.exit(1);
      }
      roleManager.assignRole(email, role);
      break;

    case 'get':
      if (!email) {
        console.log('Usage: node role-manager.js get <email>');
        process.exit(1);
      }
      roleManager.getUserRole(email).then(result => {
        if (result.success) {
          console.log('User:', result.data);
        } else {
          console.error('Error:', result.error);
        }
      });
      break;

    case 'list':
      const filterRole = email; // reuse email param as role filter
      roleManager.listUsersByRole(filterRole).then(result => {
        if (result.success) {
          console.log(`Users${filterRole ? ` with role '${filterRole}'` : ''}:`);
          result.data.forEach(user => {
            console.log(`- ${user.email} (${user.role || 'no role'}) - ${user.full_name || 'No name'}`);
          });
        } else {
          console.error('Error:', result.error);
        }
      });
      break;

    case 'admin':
      if (!email) {
        console.log('Usage: node role-manager.js admin <email>');
        process.exit(1);
      }
      roleManager.createAdminUser(email);
      break;

    case 'validate':
      roleManager.validateRoleSystem();
      break;

    default:
      console.log('Role Manager Commands:');
      console.log('  assign <email> [role]  - Assign role to user');
      console.log('  get <email>           - Get user role');
      console.log('  list [role]           - List all users or users with specific role');
      console.log('  admin <email>         - Make user admin');
      console.log('  validate              - Validate role system');
      break;
  }
}

module.exports = { RoleManager, roleManager };
