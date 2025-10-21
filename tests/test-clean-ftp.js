const { FTPUploader } = require('./lib/ftp-client.ts');

async function testCleanFTP() {
  console.log('🧹 Testing CLEANED FTP Structure...');
  
  const ftp = new FTPUploader();
  
  try {
    await ftp.connect();
    console.log('✅ Connected to FTP server');
    
    // Test simplified structure: RELEASES/[number]
    const testReleaseNumber = 'CLEAN-TEST-2024';
    const mainFolder = 'RELEASES';
    const releaseFolder = `${mainFolder}/${testReleaseNumber}`;
    
    console.log(`📁 Creating simplified structure: ${releaseFolder}`);
    
    // Create RELEASES main folder
    await ftp.ensureDirectory(mainFolder);
    
    // Create release folder directly under RELEASES (no nested "releases" folder)
    await ftp.ensureDirectory(releaseFolder);
    
    console.log('✅ Clean folder structure created');
    console.log('📋 Structure: RELEASES/[releaseNumber]/ (no nesting)');
    
    await ftp.disconnect();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await ftp.disconnect();
  }
}

testCleanFTP();
