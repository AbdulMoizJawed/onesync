const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createSampleReleases() {
  try {
    console.log('Creating sample releases with image URLs...\n');
    
    const sampleReleases = [
      {
        title: 'Sample Album 1',
        artist_name: 'Test Artist 1',
        cover_art_url: 'https://i.scdn.co/image/ab67616d0000b273a048415db06a5b6fa7ec4e1a',
        status: 'live',
        release_date: '2024-01-01',
        genre: 'Pop',
        upc: '123456789012',
        type: 'album'
      },
      {
        title: 'Sample Album 2', 
        artist_name: 'Test Artist 2',
        cover_art_url: 'https://i.scdn.co/image/ab67616d0000b273d8cc2281fcd4519ca020926b',
        status: 'live',
        release_date: '2024-02-01',
        genre: 'Hip Hop',
        upc: '123456789013',
        type: 'album'
      },
      {
        title: 'Sample Single',
        artist_name: 'Test Artist 3',
        cover_art_url: 'https://i.scdn.co/image/ab67616d0000b273fc915b69600616c2991bb809',
        status: 'live',
        release_date: '2024-03-01',
        genre: 'Rock',
        upc: '123456789014',
        type: 'single'
      }
    ];

    for (const release of sampleReleases) {
      const { data, error } = await supabase
        .from('releases')
        .insert([release]);

      if (error) {
        console.error(`Error inserting ${release.title}:`, error);
      } else {
        console.log(`✓ Created release: ${release.title}`);
      }
    }

    // Verify the releases were created
    const { data: allReleases, error: fetchError } = await supabase
      .from('releases')
      .select('id, title, artist_name, cover_art_url')
      .limit(10);

    if (fetchError) {
      console.error('Error fetching releases:', fetchError);
    } else {
      console.log(`\n✓ Total releases in database: ${allReleases.length}`);
      allReleases.forEach(release => {
        console.log(`  - ${release.title} by ${release.artist_name}`);
        console.log(`    Image: ${release.cover_art_url}`);
      });
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

createSampleReleases();