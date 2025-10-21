#!/usr/bin/env node

/**
 * Direct SpotOnTrack API Test
 * This script tests the SpotOnTrack API key directly without any intermediary code
 */

require('dotenv').config({ path: '.env.local' });
// const fetch = require('node-fetch');

// Get API key directly from .env.local
const API_KEY = process.env.SPOTONTRACK_API_KEY;
console.log('Testing with API key:', API_KEY ? `${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 5)}` : 'Not found');

// Function to test the API directly
async function testDirectApiCall() {
  try {
    // Simple test query
    const response = await fetch('https://www.spotontrack.com/api/v1/tracks?query=Drake', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
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

// Run the test
console.log('🔍 DIRECT API TEST - NO INTERMEDIARIES');
testDirectApiCall().then(success => {
  console.log('Test completed with', success ? 'SUCCESS ✅' : 'FAILURE ❌');
  
  if (success) {
    console.log('\n🔍 RECOMMENDATIONS:');
    console.log('1. Verify the API key is correctly loaded in Next.js app');
    console.log('2. Check if restart of development server is needed');
    console.log('3. Try clearing browser cache or using incognito mode');
    console.log('4. Check network requests in browser dev tools');
  }
});
