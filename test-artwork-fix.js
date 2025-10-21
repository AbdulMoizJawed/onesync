#!/usr/bin/env node

async function testArtworkAPI() {
  console.log('🎨 Testing AI Artwork Generation API Fix...\n');

  const { default: fetch } = await import('node-fetch');

  try {
    console.log('1. Testing /api/generate-artwork endpoint...');
    const response1 = await fetch('http://localhost:3000/api/generate-artwork', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'futuristic neon city album cover',
        width: 1024,
        height: 1024
      })
    });

    const result1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(result1, null, 2));

    console.log('\n2. Testing /api/artist-tools/generate-artwork endpoint...');
    const response2 = await fetch('http://localhost:3000/api/artist-tools/generate-artwork', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'futuristic neon city album cover'
      })
    });

    const result2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', JSON.stringify(result2, null, 2));

    console.log('\n✅ API test completed!');
    console.log('If you see real AI generation (isRealAI: true), the fix worked!');

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testArtworkAPI();