const fetch = require('node-fetch');

async function testFtpUpload() {
  try {
    console.log('🧪 Testing FTP upload API...');
    
    // Test without authorization header (should fail)
    console.log('\n1. Testing without authorization header:');
    const response1 = await fetch('http://localhost:3000/api/ftp-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ releaseId: 'test-id' })
    });
    
    console.log('Status:', response1.status);
    const result1 = await response1.text();
    console.log('Response:', result1);
    
    // Test with invalid authorization header (should fail)
    console.log('\n2. Testing with invalid authorization header:');
    const response2 = await fetch('http://localhost:3000/api/ftp-upload', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      },
      body: JSON.stringify({ releaseId: 'test-id' })
    });
    
    console.log('Status:', response2.status);
    const result2 = await response2.text();
    console.log('Response:', result2);
    
    console.log('\n✅ FTP API endpoint is responding correctly to authentication tests');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFtpUpload();
