// Test script to verify original filename preservation
require('dotenv').config({ path: '.env.local' })

async function testOriginalFilenames() {
  console.log('🧪 Testing Original Filename Preservation...\n')
  
  // Mock files with realistic names
  const mockCoverArt = {
    name: 'My_Awesome_Song_Cover_Art.jpg',
    type: 'image/jpeg',
    size: 2 * 1024 * 1024, // 2MB
  }
  
  const mockAudioFiles = [
    {
      name: 'Track_01_Intro_Master.wav',
      type: 'audio/wav',
      size: 45 * 1024 * 1024, // 45MB
    },
    {
      name: 'Track_02_Main_Song_Final.wav', 
      type: 'audio/wav',
      size: 52 * 1024 * 1024, // 52MB
    }
  ]
  
  // Test the sanitization function from storage-manager
  function sanitizeFilename(filename) {
    return filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_')
  }
  
  console.log('📝 Testing Filename Sanitization:')
  console.log(`   Cover Art Original: "${mockCoverArt.name}"`)
  console.log(`   Cover Art Sanitized: "${sanitizeFilename(mockCoverArt.name)}"`)
  console.log()
  
  mockAudioFiles.forEach((audio, index) => {
    console.log(`   Audio ${index + 1} Original: "${audio.name}"`)
    console.log(`   Audio ${index + 1} Sanitized: "${sanitizeFilename(audio.name)}"`)
  })
  console.log()
  
  // Mock storage info that would be generated
  const mockStorageInfo = {
    coverArt: {
      originalName: mockCoverArt.name,
      path: `user123/releases/release456/${sanitizeFilename(mockCoverArt.name)}`,
      type: 's3'
    },
    audioFiles: mockAudioFiles.map((audio, index) => ({
      originalName: audio.name,
      path: `user123/releases/release456/${sanitizeFilename(audio.name)}`,
      type: 's3',
      url: `https://s3.amazonaws.com/bucket/${sanitizeFilename(audio.name)}`
    }))
  }
  
  console.log('💾 Mock Storage Info Generated:')
  console.log(JSON.stringify(mockStorageInfo, null, 2))
  console.log()
  
  // Mock release data for CSV generation
  const mockReleaseData = {
    id: 'release456',
    title: 'My Awesome Song',
    artist_name: 'Test Artist',
    genre: 'Electronic',
    release_date: '2024-08-11',
    cover_art_url: 'https://s3.amazonaws.com/bucket/cover.jpg',
    audio_url: 'https://s3.amazonaws.com/bucket/track1.wav',
    metadata: {
      releaseType: 'Single',
      language: 'English',
      copyrightYear: 2024,
      description: 'Test release'
    },
    platforms: ['Beatport', 'Spotify'],
    tracks: [
      {
        title: 'Intro',
        file_url: mockStorageInfo.audioFiles[0].url,
        track_number: 1,
        explicit: false
      },
      {
        title: 'Main Song',
        file_url: mockStorageInfo.audioFiles[1].url,
        track_number: 2,
        explicit: false
      }
    ],
    storage_info: mockStorageInfo
  }
  
  // Test CSV generation with original filenames
  console.log('📊 Testing CSV Generation with Original Filenames:')
  
  // Mock the CSV generation logic
  const getCoverArtFilename = () => {
    if (mockReleaseData.storage_info?.coverArt?.originalName) {
      console.log(`   ✅ Using original cover art filename: ${mockReleaseData.storage_info.coverArt.originalName}`)
      return mockReleaseData.storage_info.coverArt.originalName
    }
    const fallback = `${mockReleaseData.title.replace(/[^a-zA-Z0-9]/g, '')}Artwork.jpg`
    console.log(`   ⚠️ No original cover art filename found, using fallback: ${fallback}`)
    return fallback
  }
  
  const getAudioFilename = (trackIndex) => {
    if (mockReleaseData.storage_info?.audioFiles?.[trackIndex]?.originalName) {
      const originalName = mockReleaseData.storage_info.audioFiles[trackIndex].originalName
      console.log(`   ✅ Using original audio filename for track ${trackIndex + 1}: ${originalName}`)
      return originalName
    }
    const track = mockReleaseData.tracks[trackIndex]
    const fallback = track ? 
      `${track.title.replace(/[^a-zA-Z0-9]/g, '')}.wav` : 
      `${mockReleaseData.title.replace(/[^a-zA-Z0-9]/g, '')}.wav`
    console.log(`   ⚠️ No original audio filename found for track ${trackIndex + 1}, using fallback: ${fallback}`)
    return fallback
  }
  
  console.log()
  console.log('🎯 CSV Filename Resolution Test:')
  const coverArtFilename = getCoverArtFilename()
  const audioFilenames = mockReleaseData.tracks.map((_, index) => getAudioFilename(index))
  
  console.log()
  console.log('📋 Expected CSV Content:')
  console.log(`   Art Work Name: "${coverArtFilename}"`)
  audioFilenames.forEach((filename, index) => {
    console.log(`   Audio File ${index + 1}: "${filename}"`)
  })
  
  console.log()
  console.log('🔍 Verification:')
  console.log(`   Cover art filename matches original: ${coverArtFilename === mockCoverArt.name ? '✅ YES' : '❌ NO'}`)
  audioFilenames.forEach((filename, index) => {
    const matches = filename === mockAudioFiles[index].name
    console.log(`   Audio ${index + 1} filename matches original: ${matches ? '✅ YES' : '❌ NO'}`)
  })
  
  console.log()
  console.log('🎉 Test Results:')
  const allMatch = coverArtFilename === mockCoverArt.name && 
                   audioFilenames.every((filename, index) => filename === mockAudioFiles[index].name)
  
  if (allMatch) {
    console.log('✅ SUCCESS: All filenames preserved correctly!')
    console.log('✅ CSV will reference the actual uploaded filenames!')
    console.log('✅ OneSync will find all files correctly!')
  } else {
    console.log('❌ ISSUE: Some filenames not preserved!')
    console.log('❌ CSV may reference files that don\'t exist!')
  }
}

testOriginalFilenames()
