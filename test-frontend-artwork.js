#!/usr/bin/env node

async function testArtworkFrontendAPI() {
  console.log('🎨 Testing Frontend AI Artwork API Fix...\n');

  const { default: fetch } = await import('node-fetch');

  try {
    console.log('Testing /api/artwork/generate endpoint (used by frontend)...');
    const response = await fetch('http://localhost:3000/api/artwork/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'futuristic synthwave album cover with neon pink and blue'
      })
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response keys:', Object.keys(result));
    console.log('Is Real AI:', result.isRealAI);
    console.log('Message:', result.message);
    console.log('Has Image:', result.hasImage);

    if (result.success && result.isRealAI) {
      console.log('\n✅ SUCCESS! Your custom prompts are now working with real AI generation!');
    } else if (result.success) {
      console.log('\n⚠️ API working but using placeholder (models might be busy)');
    } else {
      console.log('\n❌ API failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testArtworkFrontendAPI();