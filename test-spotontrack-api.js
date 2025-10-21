// SpotOnTrack API Test
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

// Test directly with the key from .env.local
const apiKey = process.env.SPOTONTRACK_API_KEY;
console.log('Testing with API key:', apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 5)}` : 'Not found');

async function testSpotOnTrackAPI() {
  try {
    const response = await fetch('https://www.spotontrack.com/api/v1/tracks?query=Drake', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Found', data.length, 'results');
      if (data.length > 0) {
        console.log('First result:', data[0].name);
      }
      return true;
    } else {
      const text = await response.text();
      console.error('API error:', response.status, text);
      return false;
    }
  } catch (error) {
    console.error('Request failed:', error);
    return false;
  }
}

testSpotOnTrackAPI().then(success => {
  console.log('Test completed with', success ? 'SUCCESS' : 'FAILURE');
  process.exit(success ? 0 : 1);
});
