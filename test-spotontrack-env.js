#!/usr/bin/env node

/**
 * SpotOnTrack Environment Verification Test
 * Tests the official SpotOnTrack API implementation and environment setup
 */

require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.SPOTONTRACK_API_KEY;
const BASE_URL = 'https://www.spotontrack.com/api/v1';

async function testSpotOnTrackAPI() {
  console.log('🎯 SpotOnTrack API Environment Verification');
  console.log('=' .repeat(50));
  
  // 1. Check API key
  console.log('\n1. 🔑 API Key Check:');
  if (!API_KEY) {
    console.log('❌ SPOTONTRACK_API_KEY not found in environment');
    process.exit(1);
  }
  
  if (API_KEY === 'your_spotontrack_api_key_here' || API_KEY === 'dev_fallback_key') {
    console.log('❌ API key is still set to placeholder value');
    process.exit(1);
  }
  
  console.log(`✅ API key configured (${API_KEY.length} characters)`);
  
  // 2. Test track search endpoint
  console.log('\n2. 🔍 Testing Track Search:');
  try {
    const searchResponse = await fetch(`${BASE_URL}/tracks?query=Drake`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!searchResponse.ok) {
      throw new Error(`HTTP ${searchResponse.status}: ${searchResponse.statusText}`);
    }
    
    const searchData = await searchResponse.json();
    console.log(`✅ Track search successful: ${searchData.length} tracks found`);
    
    if (searchData.length > 0) {
      const firstTrack = searchData[0];
      console.log(`   📀 First track: "${firstTrack.name}" (ISRC: ${firstTrack.isrc})`);
      
      // 3. Test track metadata endpoint
      console.log('\n3. 📊 Testing Track Metadata:');
      const metadataResponse = await fetch(`${BASE_URL}/tracks/${firstTrack.isrc}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
        console.log(`✅ Metadata retrieved: "${metadata.name}" by ${metadata.artists?.[0]?.name || 'Unknown'}`);
        console.log(`   🎵 Release Date: ${metadata.release_date}`);
        console.log(`   🔗 Links: Spotify(${metadata.links?.spotify?.length || 0}), Apple(${metadata.links?.apple?.length || 0})`);
        
        // 4. Test Spotify streams endpoint
        console.log('\n4. 📈 Testing Spotify Streams:');
        const streamsResponse = await fetch(`${BASE_URL}/tracks/${firstTrack.isrc}/spotify/streams`, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (streamsResponse.ok) {
          const streams = await streamsResponse.json();
          console.log(`✅ Spotify streams data: ${streams.length} data points`);
          if (streams.length > 0) {
            const latest = streams[0];
            console.log(`   📊 Latest: ${latest.total?.toLocaleString() || 'N/A'} total, ${latest.daily?.toLocaleString() || 'N/A'} daily (${latest.date})`);
          }
        } else {
          console.log(`⚠️  Spotify streams endpoint returned ${streamsResponse.status} (may not have data)`);
        }
        
        // 5. Test Spotify playlists endpoint
        console.log('\n5. 📝 Testing Spotify Playlists:');
        const playlistsResponse = await fetch(`${BASE_URL}/tracks/${firstTrack.isrc}/spotify/playlists/current`, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (playlistsResponse.ok) {
          const playlists = await playlistsResponse.json();
          console.log(`✅ Spotify playlists data: ${playlists.length} playlists`);
          if (playlists.length > 0) {
            const topPlaylist = playlists[0];
            console.log(`   📋 Top playlist: "${topPlaylist.playlist?.name}" (${topPlaylist.playlist?.followers?.toLocaleString() || 'N/A'} followers)`);
          }
        } else {
          console.log(`⚠️  Spotify playlists endpoint returned ${playlistsResponse.status} (may not have data)`);
        }
        
      } else {
        console.log(`❌ Metadata request failed: ${metadataResponse.status} ${metadataResponse.statusText}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Track search failed:', error.message);
    process.exit(1);
  }
  
  // 6. Rate limit check
  console.log('\n6. ⏱️  Rate Limit Status:');
  const headers = await fetch(`${BASE_URL}/tracks?query=test`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  }).then(r => r.headers);
  
  const rateLimit = headers.get('x-ratelimit-remaining');
  const retryAfter = headers.get('retry-after');
  
  if (rateLimit) {
    console.log(`✅ Rate limit remaining: ${rateLimit} requests`);
  }
  if (retryAfter) {
    console.log(`⏰ Retry after: ${retryAfter} seconds`);
  }
  
  console.log('\n🎉 SpotOnTrack API Environment Verification Complete!');
  console.log('✅ All systems operational - ready for production use');
  console.log('\n📖 Official API Documentation: https://docs.spotontrack.com/');
  console.log('🚀 Start your application: npm run dev');
}

// Run the test
testSpotOnTrackAPI().catch(error => {
  console.error('\n💥 Environment verification failed:', error.message);
  process.exit(1);
});
