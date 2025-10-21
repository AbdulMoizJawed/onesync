// Test actual cover art upload to both FTP and S3
require('dotenv').config({ path: '.env.local' })

async function testCoverArtUpload() {
  console.log('🖼️ Testing cover art upload to both FTP and S3...')
  
  try {
    // Create a simple test image buffer (1x1 PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0B, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ])
    
    // Create FormData to simulate a real upload
    const { FormData } = await import('formdata-node')
    const { Blob } = await import('buffer')
    
    const formData = new FormData()
    formData.append('releaseId', 'test-' + Date.now())
    formData.append('userId', 'test-user')
    formData.append('coverArt', new Blob([testImageBuffer], { type: 'image/png' }), 'test-cover.png')
    formData.append('forceStorage', 'hybrid') // This should trigger both FTP and S3
    
    // Test the hybrid upload API
    const response = await fetch('http://localhost:3000/api/hybrid-upload', {
      method: 'POST',
      body: formData
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Upload successful!')
      console.log('📊 Result:', JSON.stringify(result, null, 2))
    } else {
      const error = await response.text()
      console.log('❌ Upload failed:', error)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testCoverArtUpload()
