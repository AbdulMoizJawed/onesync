// Test the updated music API authentication
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Import our modules
const { musicAPIClient } = require('./lib/music-apis');

async function testSpotifyAuthentication() {
  console.log('🔧 Testing Spotify API authentication...');
  
  try {
    // Test authentication
    console.log('Getting access token...');
    const token = await musicAPIClient.getSpotifyAccessToken();
    console.log('✅ Authentication successful!');
    console.log('Token:', token.substring(0, 20) + '...');
    
    // Test artist search
    console.log('\nTesting artist search...');
    const result = await musicAPIClient.searchArtist('Drake');
    
    if (result) {
      console.log('✅ Artist search successful!');
      console.log('Artist found:', result.name);
      console.log('Spotify URL:', result.spotifyUrl);
      console.log('Followers:', result.followers);
      console.log('Genres:', result.genres);
    } else {
      console.log('❌ Artist search returned null');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSpotifyAuthentication();
