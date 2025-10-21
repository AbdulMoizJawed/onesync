#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { exec } = require('child_process');

console.log('Starting simple verification test...');

// Function to test the API directly using curl
function testWithCurl() {
  console.log('Testing hybrid upload API using curl...');
  
  // Create temporary test files
  const tmpDir = path.join(__dirname, 'tmp-test');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  
  // Create a small test image file
  const imagePath = path.join(tmpDir, 'test-image.jpg');
  fs.writeFileSync(imagePath, Buffer.alloc(500 * 1024)); // 500KB
  
  // Create a small test audio file
  const audioPath = path.join(tmpDir, 'test-audio.mp3');
  fs.writeFileSync(audioPath, Buffer.alloc(1 * 1024 * 1024)); // 1MB
  
  // Generate a unique release ID
  const releaseId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  // Construct the curl command
  const curlCommand = `curl -X POST http://localhost:3000/api/hybrid-upload \
    -F "releaseId=${releaseId}" \
    -F "userId=test-user-123" \
    -F "forceStorage=hybrid" \
    -F "coverArt=@${imagePath}" \
    -F "audioFile0=@${audioPath}"`;
  
  // Execute the curl command
  exec(curlCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing curl: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Curl stderr: ${stderr}`);
    }
    
    console.log('API Response:');
    try {
      const response = JSON.parse(stdout);
      console.log(JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('\n✅ Hybrid upload test PASSED!');
        console.log('  - Cover Art stored in:', response.storageDetails.coverArt.type);
        response.storageDetails.audioFiles.forEach((file, i) => {
          console.log(`  - Audio File ${i+1} stored in:`, file.type);
        });
      } else {
        console.log('\n❌ Hybrid upload test FAILED!');
        console.log('Error:', response.error, response.details);
      }
    } catch (e) {
      console.error('Error parsing response:', e);
      console.log('Raw response:', stdout);
    }
    
    // Clean up
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
}

// Start the test
testWithCurl();
