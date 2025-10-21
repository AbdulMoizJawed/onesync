const { default: fetch } = require('node-fetch');

async function testIndustryStatsAPI() {
  const API_KEY = 'jgdRcPw42mGxmcgFb2icOopo4HCRbNkwfiefxeLCbc2f9fe8';
  const testQuery = 'Drake';
  
  try {
    console.log(`Testing search for: ${testQuery}`);
    
    const response = await fetch(`https://allorigins.hexmos.com/api/get?url=${encodeURIComponent(`https://api.allorigins.win/raw?url=https://api.spotontrack.com/search/tracks?q=${encodeURIComponent(testQuery)}&apikey=${API_KEY}`)}`);
    
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    console.log('API Response sample:');
    
    if (data.contents) {
      const tracks = JSON.parse(data.contents);
      if (tracks && tracks.length > 0) {
        console.log(`Found ${tracks.length} tracks`);
        const firstTrack = tracks[0];
        console.log('First track:');
        console.log(`- Name: ${firstTrack.name}`);
        console.log(`- Artwork: ${firstTrack.artwork}`);
        console.log(`- Release Date: ${firstTrack.release_date}`);
        
        // Test if artwork URL is accessible
        if (firstTrack.artwork) {
          const artworkResponse = await fetch(firstTrack.artwork);
          console.log(`Artwork URL test: ${artworkResponse.status} ${artworkResponse.statusText}`);
          console.log(`Content-Type: ${artworkResponse.headers.get('content-type')}`);
        }
      } else {
        console.log('No tracks found in response');
      }
    } else {
      console.log('Unexpected response format:', data);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testIndustryStatsAPI();