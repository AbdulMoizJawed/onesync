const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bazfqignsrvxwbisfwqw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhemZxaWduc3J2eHdiaXNmd3F3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNDI0NCwiZXhwIjoyMDY5NjEwMjQ0fQ.vN5DsurFV94F_4DCjgoCV7miuK7fECaicauw19AtrUY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetTestPassword() {
  try {
    console.log('Resetting password for info@onesync.music...');
    
    // Update the password for the user
    const { data, error } = await supabase.auth.admin.updateUserById(
      '046c6b07-03b3-46d4-88f5-9b4f2d5e9da8', // This would need to be the actual user ID
      {
        password: 'newpassword123'
      }
    );

    if (error) {
      console.error('Error updating password:', error);
      
      // Try creating a simple test user instead
      console.log('Trying to create simple test user...');
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: 'testuser@test.com',
        password: 'testpass123',
        email_confirm: true
      });

      if (createError) {
        console.error('Error creating test user:', createError);
      } else {
        console.log('✅ Test user created successfully!');
        console.log('📧 Email: testuser@test.com');
        console.log('🔑 Password: testpass123');
        console.log('👤 User ID:', createData.user.id);
      }
    } else {
      console.log('Password updated successfully!');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

resetTestPassword();
