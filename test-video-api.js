// Test script for video generation API
async function testVideoAPI() {
  try {
    console.log('🎬 Testing video generation API...')
    
    const response = await fetch('http://localhost:3001/api/artist-tools/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: "music visualizer with colorful beats and waves" 
      })
    })
    
    const data = await response.json()
    console.log('📹 Video API Response:', {
      success: data.success,
      isRealAI: data.isRealAI,
      hasVideo: data.hasVideo,
      generationMethod: data.generationMethod,
      videoUrlLength: data.videoUrl?.length || 0
    })
    
    if (data.success) {
      console.log('✅ Video generation API is working!')
    } else {
      console.log('❌ Video generation failed:', data.error)
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message)
  }
}

// Run the test
testVideoAPI()
