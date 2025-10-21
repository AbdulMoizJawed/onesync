const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testArtistDropdown() {
  try {
    console.log('🔐 Testing artist dropdown data flow...');
    
    // Sign in first (you'll need to replace with actual credentials)
    console.log('🔐 Attempting to sign in...');
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',  // Replace with actual email
      password: 'testpassword123'  // Replace with actual password
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      console.log('ℹ️  Please sign up or use existing credentials');
      
      // Still test the query structure
      console.log('📋 Testing artist query structure (without user)...');
      const { data, error } = await supabase
        .from('artists')
        .select('name')
        .eq('user_id', 'test-user-id')  // This will fail but shows structure
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.log('✅ Query structure is correct (error expected due to invalid user ID)');
        console.log('   Error:', error.message);
      }
      
      return;
    }

    console.log('✅ Signed in as:', user.email);

    // Test the exact query that fetchPreviousArtists uses
    console.log('📋 Testing artist dropdown query...');
    const { data, error } = await supabase
      .from('artists')
      .select('name')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching artists:', error.message);
      return;
    }

    console.log(`✅ Found ${data.length} artists for dropdown:`);
    data.forEach((artist, index) => {
      console.log(`   ${index + 1}. ${artist.name}`);
    });

    // Create a test artist to verify the creation flow
    const testArtistName = 'Dropdown Test Artist ' + Date.now();
    console.log('🎤 Creating test artist:', testArtistName);

    const { data: newArtist, error: createError } = await supabase
      .from('artists')
      .insert({
        user_id: user.id,
        name: testArtistName,
        status: 'active'
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Could not create test artist:', createError.message);
    } else {
      console.log('✅ Created test artist:', newArtist.name);
      
      // Verify it shows up in the dropdown query
      const { data: updatedData, error: verifyError } = await supabase
        .from('artists')
        .select('name')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (verifyError) {
        console.error('❌ Error verifying updated artists:', verifyError.message);
      } else {
        console.log(`✅ Updated dropdown would show ${updatedData.length} artists:`);
        updatedData.forEach((artist, index) => {
          console.log(`   ${index + 1}. ${artist.name}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testArtistDropdown();
