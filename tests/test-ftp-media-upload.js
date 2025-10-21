// Test script to verify that media files are uploaded to FTP
import { ftpUploader } from './lib/ftp-client.js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testFtpMediaUpload() {
  console.log('🧪 Testing FTP media file upload...');
  
  // Create a mock release with sample media URLs
  const mockRelease = {
    id: 'test-' + Date.now(),
    title: 'Test Release',
    artist_name: 'Test Artist',
    genre: 'Electronic',
    release_date: new Date().toISOString(),
    // Use sample image and audio URLs - adjust if needed
    cover_art_url: 'https://source.unsplash.com/random/500x500',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    metadata: {
      releaseType: 'Single',
      language: 'English',
      copyrightYear: 2023,
      description: 'Test release for FTP upload',
      tags: ['test', 'upload'],
    },
    platforms: ['Spotify', 'Apple Music'],
  };
  
  try {
    console.log('📤 Starting FTP upload with media files...');
    const result = await ftpUploader.uploadRelease(mockRelease);
    
    console.log('📊 Upload result:', result);
    
    if (result.success) {
      console.log('✅ Test completed successfully! Release number:', result.releaseNumber);
      console.log('Media files should have been uploaded to the FTP server.');
      
      // List directory contents to verify
      await ftpUploader.connect();
      const mainFolder = 'music_distribution';
      const dirContents = await ftpUploader.client.list(mainFolder);
      console.log('📂 FTP directory contents:');
      dirContents.forEach(item => {
        console.log(`   ${item.name} (${item.size} bytes)`);
      });
      await ftpUploader.disconnect();
    } else {
      console.error('❌ Test failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Run the test
testFtpMediaUpload().catch(console.error);
