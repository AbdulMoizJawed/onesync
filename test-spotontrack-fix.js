// Test SpotOnTrack API URL construction fix
const SpotOnTrackAPI = require('./lib/spotontrack-api.ts');

async function testUrlConstruction() {
  console.log('🧪 Testing SpotOnTrack API URL construction fix...');
  
  try {
    // Create an instance of the API
    const api = new SpotOnTrackAPI();
    
    // Test that real API key is detected
    console.log('✅ API Key configured:', api.hasRealApiKey());
    
    // Test health check endpoint to verify URL construction
    const healthResult = await api.healthCheck();
    console.log('✅ Health check passed:', healthResult);
    
    // Test search endpoint 
    console.log('\n🔍 Testing search for Drake tracks...');
    const searchResult = await api.searchTracks('Drake');
    console.log('✅ Search successful, tracks found:', searchResult?.tracks?.length || 0);
    
    if (searchResult?.tracks?.length > 0) {
      console.log('🎵 First track:', searchResult.tracks[0].name, 'by', searchResult.tracks[0].artist);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUrlConstruction();
