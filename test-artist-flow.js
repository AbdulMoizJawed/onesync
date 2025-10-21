const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testArtistFlow() {
  try {
    console.log('🔐 Testing artist creation flow...');
    
    // Simulate the artist creation logic from upload page
    const userId = 'test-user-id'; // This would be the actual user ID in real flow
    const artistName = 'Test Artist ' + Date.now();
    
    console.log('🎤 Simulating artist creation for:', artistName);
    
    // Check if artist already exists for this user (this is the same logic as in upload page)
    const { data: existingArtist, error: artistCheckError } = await supabase
      .from('artists')
      .select('id, name')
      .eq('user_id', userId)
      .ilike('name', artistName.trim())
      .single();

    if (artistCheckError && artistCheckError.code !== 'PGRST116') {
      console.warn('⚠️ Error checking for existing artist:', artistCheckError.message);
    }

    if (!existingArtist) {
      // Create new artist record
      console.log('✅ Artist does not exist, would create new record');
      console.log('   Artist name:', artistName.trim());
      console.log('   User ID:', userId);
      console.log('   Status: active');
    } else {
      console.log('✅ Artist already exists:', existingArtist.name);
    }
    
    // Test fetching artists for dropdown (this is what upload page does)
    console.log('📋 Testing artist fetch for dropdown...');
    const { data: userArtists, error: fetchError } = await supabase
      .from('artists')
      .select('*')
      .eq('user_id', userId);
    
    if (fetchError) {
      console.error('❌ Could not fetch artists:', fetchError.message);
    } else {
      console.log(`✅ Found ${userArtists.length} artists for user:`, userArtists.map(a => a.name));
    }
    
    console.log('✅ Artist flow test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testArtistFlow();
