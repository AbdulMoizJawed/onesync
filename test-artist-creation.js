const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testArtistCreation() {
  try {
    // First sign in to test with a real user
    console.log('🔐 Attempting to sign in...');
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      console.log('ℹ️  You may need to sign up first or use different credentials');
      return;
    }

    if (!user) {
      console.error('❌ No user returned from auth');
      return;
    }

    console.log('✅ Signed in as:', user.email);

    // Test creating an artist
    const testArtistName = 'Test Artist ' + Date.now();
    console.log('🎤 Creating test artist:', testArtistName);

    const { data: existingArtist, error: checkError } = await supabase
      .from('artists')
      .select('id, name')
      .eq('user_id', user.id)
      .ilike('name', testArtistName.trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.warn('⚠️ Error checking for existing artist:', checkError.message);
    }

    if (!existingArtist) {
      const { data: newArtist, error: createError } = await supabase
        .from('artists')
        .insert({
          user_id: user.id,
          name: testArtistName.trim(),
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Could not create artist:', createError.message);
      } else {
        console.log('✅ Created new artist:', newArtist);
      }
    } else {
      console.log('✅ Artist already exists:', existingArtist.name);
    }

    // List all artists for this user
    const { data: allArtists, error: listError } = await supabase
      .from('artists')
      .select('*')
      .eq('user_id', user.id);

    if (listError) {
      console.error('❌ Could not list artists:', listError.message);
    } else {
      console.log('📋 All artists for user:');
      allArtists.forEach(artist => {
        console.log(`   - ${artist.name} (${artist.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testArtistCreation();
