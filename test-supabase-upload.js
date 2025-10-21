const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');

async function testSupabaseUpload() {
  try {
    console.log('🧪 Testing Supabase upload API...');
    
    // Create a test image file (1x1 pixel PNG)
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    
    // Create a test audio file (empty MP3 header)
    const testAudioBuffer = Buffer.from('ID3', 'utf8');
    
    // Create form data
    const form = new FormData();
    form.append('releaseFolder', 'test-user/releases/test-123');
    form.append('userId', 'test-user-id');
    form.append('coverArt', testImageBuffer, {
      filename: 'test-cover.png',
      contentType: 'image/png'
    });
    form.append('audioFile0', testAudioBuffer, {
      filename: 'test-track.mp3',
      contentType: 'audio/mpeg'
    });
    
    console.log('📤 Sending test upload request...');
    
    const response = await fetch('http://localhost:3001/api/supabase-upload', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Upload API test successful!');
      console.log('📸 Cover art URL:', result.coverArtUrl);
      console.log('🎵 Audio URLs:', result.audioUrls);
      console.log('🗄️ Storage provider:', result.storageProvider);
    } else {
      console.error('❌ Upload API test failed:', result.error);
      console.log('Details:', result.details);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSupabaseUpload();
