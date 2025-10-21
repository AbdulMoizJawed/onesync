const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkImageUrls() {
  try {
    console.log('Checking release image URLs...\n');
    
    const { data: releases, error: releasesError } = await supabase
      .from('releases')
      .select('id, title, cover_art_url')
      .limit(10);

    if (releasesError) {
      console.error('Error fetching releases:', releasesError);
      return;
    }

    console.log('Sample release image URLs:');
    releases.forEach(release => {
      console.log(`ID: ${release.id}`);
      console.log(`Title: ${release.title}`);
      console.log(`URL: ${release.cover_art_url}`);
      console.log('---');
    });

    // Check if URLs are accessible
    if (releases.length > 0 && releases[0].cover_art_url) {
      const testUrl = releases[0].cover_art_url;
      console.log(`\nTesting URL accessibility: ${testUrl}`);
      
      try {
        const response = await fetch(testUrl);
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Content-Type: ${response.headers.get('content-type')}`);
      } catch (fetchError) {
        console.error('Failed to fetch URL:', fetchError.message);
      }
    }

  } catch (err) {
    console.error('Connection error:', err);
  }
}

checkImageUrls();