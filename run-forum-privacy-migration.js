const { supabase } = require('./lib/supabase.ts');
const fs = require('fs');

async function runForumPrivacyMigration() {
  try {
    console.log('🔄 Running forum privacy migration...');
    
    // Read the SQL file
    const sql = fs.readFileSync('./scripts/24-add-forum-privacy-columns.sql', 'utf8');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Migration failed:', error.message);
      
      // Try a simpler approach - just add the columns
      console.log('🔄 Trying simpler column addition...');
      
      const { error: addError } = await supabase.rpc('exec_sql', {
        sql_query: `
          ALTER TABLE profiles 
          ADD COLUMN IF NOT EXISTS forum_privacy JSONB DEFAULT '{"use_real_name": true, "show_avatar": true, "show_bio": true, "use_separate_forum_avatar": false, "forum_avatar_url": null, "forum_display_name": null}'::jsonb;
        `
      });
      
      if (addError) {
        console.error('❌ Simple migration also failed:', addError.message);
        console.log('ℹ️  The forum will work with basic profile data');
      } else {
        console.log('✅ Forum privacy column added successfully');
      }
    } else {
      console.log('✅ Forum privacy migration completed successfully');
    }
    
    // Test the forum author data function
    console.log('🧪 Testing forum author data function...');
    
    const { data: testUsers, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (testError) {
      console.error('❌ Test failed:', testError.message);
      return;
    }
    
    if (testUsers && testUsers.length > 0) {
      const testUserId = testUsers[0].id;
      
      const { data: testProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, bio, forum_privacy')
        .eq('id', testUserId)
        .single();
        
      if (profileError) {
        console.error('❌ Profile test failed:', profileError.message);
      } else {
        console.log('✅ Forum author data fetch test passed');
        console.log('Profile sample:', {
          id: testProfile.id,
          has_full_name: !!testProfile.full_name,
          has_username: !!testProfile.username,
          has_forum_privacy: !!testProfile.forum_privacy
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Migration script error:', error.message);
  }
}

runForumPrivacyMigration();
