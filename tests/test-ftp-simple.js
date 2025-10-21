// CommonJS version of the test script for Node.js compatibility
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { Client: FTPClient } = require('basic-ftp');

async function testFtpConnection() {
  console.log('🧪 Testing FTP connection...');
  
  const client = new FTPClient();
  client.ftp.verbose = true;
  
  try {
    // FTP configuration
    const ftpConfig = {
      host: '207.244.67.71',
      port: 106,
      user: 'OneSync',
      password: 'p3gKwzhBp',
      secure: false,
      secureOptions: {
        rejectUnauthorized: false
      }
    };
    
    console.log(`🔌 Connecting to FTP: ${ftpConfig.host}:${ftpConfig.port} as ${ftpConfig.user}`);
    await client.access(ftpConfig);
    console.log('✅ FTP connection successful');
    
    // List root directory contents
    console.log('📂 Listing root directory contents...');
    const rootContents = await client.list();
    console.log('Root directory contents:', rootContents.map(item => item.name).join(', '));
    
    // List music_distribution directory if it exists
    try {
      console.log('📂 Checking music_distribution directory...');
      await client.cd('music_distribution');
      const dirContents = await client.list();
      console.log('music_distribution contents:', dirContents.map(item => item.name).join(', '));
    } catch (error) {
      console.log('⚠️ Could not access music_distribution folder:', error.message);
    }
    
    console.log('✅ FTP connection test completed');
  } catch (error) {
    console.error('❌ FTP connection test failed:', error);
  } finally {
    client.close();
    console.log('🔌 FTP connection closed');
  }
}

// Download a sample file for testing
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {}); // Delete the file if there's an error
      reject(err);
    });
  });
}

async function testFtpFileUpload() {
  console.log('🧪 Testing FTP file upload...');
  
  const client = new FTPClient();
  client.ftp.verbose = true;
  
  // Create temporary directory
  const tempDir = path.join(os.tmpdir(), `ftp-test-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  
  // Sample files to download and upload
  const sampleImage = path.join(tempDir, 'sample-image.jpg');
  const sampleAudio = path.join(tempDir, 'sample-audio.mp3');
  const sampleCSV = path.join(tempDir, 'sample.csv');
  
  try {
    // Download sample files
    console.log('📥 Downloading sample files...');
    await downloadFile('https://source.unsplash.com/random/500x500', sampleImage);
    await downloadFile('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', sampleAudio);
    
    // Create a sample CSV
    const csvContent = 'ReleaseNo,Primary Artist,Title\n1001,Test Artist,Test Release';
    fs.writeFileSync(sampleCSV, csvContent);
    
    console.log('✅ Sample files prepared');
    
    // Connect to FTP
    const ftpConfig = {
      host: '207.244.67.71',
      port: 106,
      user: 'OneSync',
      password: 'p3gKwzhBp',
      secure: false,
      secureOptions: {
        rejectUnauthorized: false
      }
    };
    
    console.log(`🔌 Connecting to FTP: ${ftpConfig.host}:${ftpConfig.port} as ${ftpConfig.user}`);
    await client.access(ftpConfig);
    console.log('✅ FTP connection successful');
    
    // Create music_distribution directory if it doesn't exist
    console.log('📁 Ensuring music_distribution directory exists...');
    try {
      await client.ensureDir('music_distribution');
      console.log('✅ Directory ready');
    } catch (error) {
      console.error('❌ Failed to create directory:', error);
      return;
    }
    
    // Upload files
    const testId = Date.now();
    
    // Upload image
    console.log('📤 Uploading image file...');
    await client.uploadFrom(sampleImage, `music_distribution/test-image-${testId}.jpg`);
    console.log('✅ Image uploaded successfully');
    
    // Upload audio
    console.log('📤 Uploading audio file...');
    await client.uploadFrom(sampleAudio, `music_distribution/test-audio-${testId}.mp3`);
    console.log('✅ Audio uploaded successfully');
    
    // Upload CSV
    console.log('📤 Uploading CSV file...');
    await client.uploadFrom(sampleCSV, `music_distribution/test-csv-${testId}.csv`);
    console.log('✅ CSV uploaded successfully');
    
    // List directory to verify uploads
    console.log('📂 Listing directory contents after uploads...');
    const dirContents = await client.list('music_distribution');
    console.log('Directory contents:', dirContents.map(item => `${item.name} (${item.size} bytes)`).join('\n'));
    
    console.log('✅ FTP file upload test completed');
  } catch (error) {
    console.error('❌ FTP file upload test failed:', error);
  } finally {
    // Cleanup
    client.close();
    console.log('🔌 FTP connection closed');
    
    // Remove temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('🧹 Temporary files cleaned up');
    } catch (e) {
      console.error('Error cleaning up temp files:', e);
    }
  }
}

// Run the tests
async function runTests() {
  try {
    await testFtpConnection();
    console.log('\n');
    await testFtpFileUpload();
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

runTests();
