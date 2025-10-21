const { storageManager } = require('./lib/storage-manager');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testHybridStorage() {
  console.log('🧪 Testing Hybrid Storage System');
  
  // Create test files
  const tempDir = path.join(require('os').tmpdir(), 'hybrid-storage-test');
  fs.mkdirSync(tempDir, { recursive: true });
  
  // Create a small test image (5KB)
  const smallImagePath = path.join(tempDir, 'small-image.jpg');
  const smallImageContent = Buffer.alloc(5 * 1024, 'A');
  fs.writeFileSync(smallImagePath, smallImageContent);
  
  // Create a large audio file (25MB)
  const largeAudioPath = path.join(tempDir, 'large-audio.wav');
  const largeAudioContent = Buffer.alloc(25 * 1024 * 1024, 'B');
  fs.writeFileSync(largeAudioPath, largeAudioContent);
  
  try {
    // Test small image upload (should use Supabase)
    const smallResult = await storageManager.uploadFile({
      name: 'small-image.jpg',
      type: 'image/jpeg',
      size: smallImageContent.length,
      // For Node.js environment
      path: smallImagePath,
      arrayBuffer: async () => smallImageContent,
      stream: () => fs.createReadStream(smallImagePath)
    }, {
      path: 'test/small-image.jpg'
    });
    
    console.log('Small file upload result:', smallResult);
    
    // Test large audio upload (should use FTP)
    const largeResult = await storageManager.uploadFile({
      name: 'large-audio.wav',
      type: 'audio/wav',
      size: largeAudioContent.length,
      // For Node.js environment
      path: largeAudioPath,
      arrayBuffer: async () => largeAudioContent,
      stream: () => fs.createReadStream(largeAudioPath)
    }, {
      path: 'test/large-audio.wav'
    });
    
    console.log('Large file upload result:', largeResult);
    
    console.log('✅ Storage tests completed');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

testHybridStorage();
