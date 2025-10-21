// Test script to debug why cover art isn't going to FTP
require('dotenv').config({ path: '.env.local' })

async function testStorageRouting() {
  console.log('🔍 Testing storage routing logic...')
  
  // Simulate a cover art file
  const mockCoverArt = {
    name: 'cover.jpg',
    type: 'image/jpeg',
    size: 2 * 1024 * 1024, // 2MB
    startsWith: function(str) { return this.type.startsWith(str) },
    endsWith: function(str) { return this.name.endsWith(str) }
  }
  
  // Simulate an audio file
  const mockAudioFile = {
    name: 'track.wav',
    type: 'audio/wav',
    size: 50 * 1024 * 1024, // 50MB
    startsWith: function(str) { return this.type.startsWith(str) },
    endsWith: function(str) { return this.name.endsWith(str) }
  }
  
  // Test the storage determination logic from storage-manager.ts
  function determineStorageDestinations(file, forceStorage) {
    const STORAGE_MAPPING = {
      MEDIA: ['ftp', 's3'],
      DATA: ['supabase']
    }
    
    // If storage is forced, respect that
    if (forceStorage) {
      console.log(`🎯 Using forced storage target: ${forceStorage}`)
      return [forceStorage]
    }
    
    // Determine file category
    const isMediaFile = 
      file.type.startsWith('audio/') || 
      file.type.startsWith('image/') || 
      file.type.startsWith('video/') ||
      file.name.endsWith('.csv')
    
    // Apply storage mapping
    const destinations = isMediaFile ? STORAGE_MAPPING.MEDIA : STORAGE_MAPPING.DATA
    
    console.log(`📊 Storage decision for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB): ${destinations.join(', ')}`)
    console.log(`   Based on: type=${file.type}, isMediaFile=${isMediaFile}`)
    
    return destinations
  }
  
  console.log('\n🖼️ Testing Cover Art (image/jpeg):')
  const coverDestinations = determineStorageDestinations(mockCoverArt)
  
  console.log('\n🎵 Testing Audio File (audio/wav):')
  const audioDestinations = determineStorageDestinations(mockAudioFile)
  
  console.log('\n🔧 Testing with forceStorage="hybrid":')
  const hybridDestinations = determineStorageDestinations(mockCoverArt, 'hybrid')
  
  console.log('\n📋 Summary:')
  console.log(`   Cover art should go to: ${coverDestinations.join(' + ')}`)
  console.log(`   Audio files should go to: ${audioDestinations.join(' + ')}`)
  console.log(`   With hybrid force: ${hybridDestinations.join(' + ')}`)
  
  // Check if both should go to FTP
  const coverGoesToFTP = coverDestinations.includes('ftp')
  const audioGoesToFTP = audioDestinations.includes('ftp')
  
  console.log('\n✅ Expected Results:')
  console.log(`   Cover art goes to FTP: ${coverGoesToFTP ? '✅ YES' : '❌ NO'}`)
  console.log(`   Audio files go to FTP: ${audioGoesToFTP ? '✅ YES' : '❌ NO'}`)
  
  if (coverGoesToFTP && audioGoesToFTP) {
    console.log('\n🎉 Storage logic is correct! Both should go to FTP.')
    console.log('🔍 The issue might be in the upload implementation or database storage.')
  } else {
    console.log('\n❌ Storage logic has issues!')
  }
}

testStorageRouting()
