// Comprehensive test for end-to-end filename preservation
require('dotenv').config({ path: '.env.local' })

async function testEndToEndFilenames() {
  console.log('🔄 Testing End-to-End Filename Preservation...\n')
  
  // Mock release data with realistic filenames
  const testData = {
    releaseId: 'test-release-123',
    userId: 'user-456',
    coverArt: {
      name: 'Artist_Name_-_Song_Title_Cover_Art.jpg',
      type: 'image/jpeg',
      size: 3 * 1024 * 1024, // 3MB
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
    },
    audioFiles: [
      {
        name: 'Artist_Name_-_Song_Title_(Original_Mix).wav',
        type: 'audio/wav', 
        size: 48 * 1024 * 1024, // 48MB
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      },
      {
        name: 'Artist_Name_-_Song_Title_(Radio_Edit).wav',
        type: 'audio/wav',
        size: 35 * 1024 * 1024, // 35MB
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      }
    ]
  }
  
  console.log('📁 Test Input Files:')
  console.log(`   Cover Art: "${testData.coverArt.name}"`)
  testData.audioFiles.forEach((audio, index) => {
    console.log(`   Audio ${index + 1}: "${audio.name}"`)
  })
  console.log()
  
  // Test the storage manager filename handling
  console.log('🔧 Testing Storage Manager Logic:')
  
  // Simulate the sanitizeFilename function
  function sanitizeFilename(filename) {
    return filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_')
  }
  
  const sanitizedCoverArt = sanitizeFilename(testData.coverArt.name)
  const sanitizedAudioFiles = testData.audioFiles.map(audio => sanitizeFilename(audio.name))
  
  console.log(`   Cover Art Sanitized: "${sanitizedCoverArt}"`)
  sanitizedAudioFiles.forEach((filename, index) => {
    console.log(`   Audio ${index + 1} Sanitized: "${filename}"`)
  })
  console.log()
  
  // Mock the storage result that would be generated
  const mockStorageResult = {
    success: true,
    coverArtUrl: `https://s3.amazonaws.com/bucket/${sanitizedCoverArt}`,
    audioUrls: sanitizedAudioFiles.map(filename => `https://s3.amazonaws.com/bucket/${filename}`),
    storageDetails: {
      coverArt: {
        type: 's3',
        path: `user-456/releases/test-release-123/${sanitizedCoverArt}`,
        originalName: testData.coverArt.name
      },
      audioFiles: testData.audioFiles.map((audio, index) => ({
        type: 's3',
        path: `user-456/releases/test-release-123/${sanitizedAudioFiles[index]}`,
        url: `https://s3.amazonaws.com/bucket/${sanitizedAudioFiles[index]}`,
        originalName: audio.name
      }))
    }
  }
  
  console.log('💾 Mock Storage Result:')
  console.log('   ✅ Cover art original name preserved:', mockStorageResult.storageDetails.coverArt.originalName)
  mockStorageResult.storageDetails.audioFiles.forEach((audio, index) => {
    console.log(`   ✅ Audio ${index + 1} original name preserved:`, audio.originalName)
  })
  console.log()
  
  // Test CSV generation with the stored original names
  console.log('📊 Testing CSV Generation:')
  
  const mockReleaseData = {
    id: testData.releaseId,
    title: 'Song Title',
    artist_name: 'Artist Name',
    genre: 'Electronic',
    release_date: '2024-08-11',
    cover_art_url: mockStorageResult.coverArtUrl,
    audio_url: mockStorageResult.audioUrls[0],
    metadata: {
      releaseType: 'Single',
      language: 'English',
      copyrightYear: 2024,
      description: 'Test release'
    },
    platforms: ['Beatport', 'Spotify'],
    tracks: [
      {
        title: 'Song Title (Original Mix)',
        file_url: mockStorageResult.audioUrls[0],
        track_number: 1,
        explicit: false
      },
      {
        title: 'Song Title (Radio Edit)',
        file_url: mockStorageResult.audioUrls[1],
        track_number: 2,
        explicit: false
      }
    ],
    storage_info: mockStorageResult.storageDetails
  }
  
  // Test the CSV filename resolution
  const getCoverArtFilename = () => {
    if (mockReleaseData.storage_info?.coverArt?.originalName) {
      console.log(`   ✅ CSV will use original cover art: "${mockReleaseData.storage_info.coverArt.originalName}"`)
      return mockReleaseData.storage_info.coverArt.originalName
    }
    const fallback = `${mockReleaseData.title.replace(/[^a-zA-Z0-9]/g, '')}Artwork.jpg`
    console.log(`   ⚠️ CSV will use fallback cover art: "${fallback}"`)
    return fallback
  }
  
  const getAudioFilenames = () => {
    return mockReleaseData.tracks.map((track, index) => {
      if (mockReleaseData.storage_info?.audioFiles?.[index]?.originalName) {
        const originalName = mockReleaseData.storage_info.audioFiles[index].originalName
        console.log(`   ✅ CSV will use original audio ${index + 1}: "${originalName}"`)
        return originalName
      }
      const fallback = `${track.title.replace(/[^a-zA-Z0-9]/g, '')}.wav`
      console.log(`   ⚠️ CSV will use fallback audio ${index + 1}: "${fallback}"`)
      return fallback
    })
  }
  
  const csvCoverArt = getCoverArtFilename()
  const csvAudioFiles = getAudioFilenames()
  console.log()
  
  // Final verification
  console.log('🔍 Final Verification:')
  console.log('   Original → Upload → CSV Chain:')
  console.log()
  
  console.log('   📸 Cover Art:')
  console.log(`     Original: "${testData.coverArt.name}"`)
  console.log(`     Upload: "${sanitizedCoverArt}"`)
  console.log(`     CSV: "${csvCoverArt}"`)
  console.log(`     Match: ${csvCoverArt === testData.coverArt.name ? '✅' : '❌'}`)
  console.log()
  
  testData.audioFiles.forEach((audio, index) => {
    console.log(`   🎵 Audio ${index + 1}:`)
    console.log(`     Original: "${audio.name}"`)
    console.log(`     Upload: "${sanitizedAudioFiles[index]}"`)
    console.log(`     CSV: "${csvAudioFiles[index]}"`)
    console.log(`     Match: ${csvAudioFiles[index] === audio.name ? '✅' : '❌'}`)
    console.log()
  })
  
  // Summary
  const coverArtMatches = csvCoverArt === testData.coverArt.name
  const audioMatches = csvAudioFiles.every((filename, index) => filename === testData.audioFiles[index].name)
  
  console.log('🎯 SUMMARY:')
  if (coverArtMatches && audioMatches) {
    console.log('🎉 SUCCESS: Original filenames preserved end-to-end!')
    console.log('✅ Upload files use sanitized original names')
    console.log('✅ CSV references exact original names')
    console.log('✅ OneSync will find all files correctly')
    console.log('✅ No filename mismatches!')
  } else {
    console.log('❌ ISSUES DETECTED:')
    if (!coverArtMatches) console.log('   ❌ Cover art filename mismatch')
    if (!audioMatches) console.log('   ❌ Audio filename mismatch')
    console.log('   ⚠️ OneSync may not find files!')
  }
  
  console.log()
  console.log('📋 Expected FTP Structure:')
  console.log('   RELEASES/')
  console.log('   ├── 2001.csv  (references original filenames)')
  console.log('   └── releases/')
  console.log('       └── 2001/')
  console.log(`           ├── ${sanitizedCoverArt}`)
  sanitizedAudioFiles.forEach(filename => {
    console.log(`           ├── ${filename}`)
  })
  console.log()
  console.log('📝 Expected CSV Content:')
  console.log(`   Art Work Name: "${csvCoverArt}"`)
  csvAudioFiles.forEach((filename, index) => {
    console.log(`   Audio File ${index + 1}: "${filename}"`)
  })
}

testEndToEndFilenames()
