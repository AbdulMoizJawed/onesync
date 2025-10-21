require('dotenv').config({ path: '.env.local' });
const { Client } = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Simple FTP client for Node.js environment
class FTPUploader {
  constructor() {
    this.client = new Client();
    this.client.ftp.verbose = true;
  }

  async connect() {
    try {
      const config = {
        host: process.env.FTP_HOST || '207.244.67.71',
        port: parseInt(process.env.FTP_PORT || '106'),
        user: process.env.FTP_USER || 'OneSync',
        password: process.env.FTP_PASSWORD || 'p3gKwzhBp',
        secure: false
      };
      
      console.log(`🔌 Connecting to FTP: ${config.host}:${config.port} as ${config.user}`);
      await this.client.access(config);
      console.log('✅ FTP connected successfully');
      return true;
    } catch (error) {
      console.error('❌ FTP connection failed:', error);
      return false;
    }
  }

  async disconnect() {
    this.client.close();
    console.log('✅ FTP connection closed');
  }

  async ensureDirectory(dirPath) {
    try {
      await this.client.ensureDir(dirPath);
      return true;
    } catch (error) {
      console.error(`Failed to create directory ${dirPath}:`, error);
      return false;
    }
  }

  async uploadFile(localPath, remotePath) {
    try {
      await this.client.uploadFrom(localPath, remotePath);
      console.log(`✅ File uploaded successfully: ${remotePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to upload ${remotePath}:`, error);
      return false;
    }
  }
}

// Simple Supabase client for Node.js environment
class SupabaseStorage {
  constructor() {
    const { createClient } = require('@supabase/supabase-js');
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  async uploadFile(file, bucket, filePath) {
    try {
      console.log(`📤 Uploading to Supabase: ${filePath}`);
      
      const { error } = await this.supabase.storage.from(bucket).upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: false,
        }
      );
      
      if (error) {
        throw error;
      }
      
      const { data } = this.supabase.storage.from(bucket).getPublicUrl(filePath);
      
      return {
        success: true,
        url: data.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error(`❌ Supabase upload error:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Simple storage manager
class StorageManager {
  constructor() {
    this.ftpUploader = new FTPUploader();
    this.supabaseStorage = new SupabaseStorage();
  }

  async uploadToSupabase(fileBuffer, fileName, bucket, filePath) {
    return this.supabaseStorage.uploadFile(fileBuffer, bucket, filePath);
  }

  async uploadToFTP(fileBuffer, filePath) {
    const tempDir = path.join(os.tmpdir(), `upload_${Date.now()}`);
    const tempFilePath = path.join(tempDir, path.basename(filePath));
    
    try {
      // Create temp directory
      fs.mkdirSync(tempDir, { recursive: true });
      
      // Write to temp file
      fs.writeFileSync(tempFilePath, fileBuffer);
      
      // Connect to FTP
      await this.ftpUploader.connect();
      
      // Ensure directory exists
      const mainFolder = 'music_distribution';
      await this.ftpUploader.ensureDirectory(mainFolder);
      
      // Generate FTP path
      const ftpPath = `${mainFolder}/${path.basename(filePath)}`;
      
      // Upload the file
      const uploaded = await this.ftpUploader.uploadFile(tempFilePath, ftpPath);
      
      if (!uploaded) {
        throw new Error(`Failed to upload file to FTP: ${ftpPath}`);
      }
      
      return {
        success: true,
        storageType: 'ftp',
        path: ftpPath
      };
    } catch (error) {
      console.error(`❌ FTP upload error:`, error);
      return {
        success: false,
        error: error.message,
        storageType: 'ftp'
      };
    } finally {
      // Clean up temporary files
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error('Error cleaning up temp files:', e);
      }
      
      // Close FTP connection
      try {
        await this.ftpUploader.disconnect();
      } catch (e) {
        console.error('Error disconnecting from FTP:', e);
      }
    }
  }

  determineStorageTarget(fileSize, fileType) {
    // Audio files or large files go to FTP
    if (
      fileType.startsWith('audio/') || 
      fileSize > 10 * 1024 * 1024 // 10MB
    ) {
      return 'ftp';
    }
    
    // Default to Supabase for smaller files
    return 'supabase';
  }

  async uploadFile(fileInfo, options) {
    const { path: filePath } = options;
    const storageTarget = this.determineStorageTarget(fileInfo.size, fileInfo.type);
    
    console.log(`📊 Storage decision for ${fileInfo.name}: ${storageTarget}`);
    console.log(`   Based on: type=${fileInfo.type}, size=${fileInfo.size / 1024 / 1024}MB`);
    
    if (storageTarget === 'ftp') {
      return this.uploadToFTP(fileInfo.buffer, filePath);
    } else {
      return this.uploadToSupabase(fileInfo.buffer, fileInfo.name, 'releases', filePath);
    }
  }
}

async function testHybridStorage() {
  console.log('🧪 Testing Hybrid Storage System');
  
  // Create test files
  const tempDir = path.join(os.tmpdir(), 'hybrid-storage-test');
  fs.mkdirSync(tempDir, { recursive: true });
  
  // Create a small test image (5KB)
  const smallImagePath = path.join(tempDir, 'small-image.jpg');
  const smallImageBuffer = Buffer.alloc(5 * 1024, 'A');
  fs.writeFileSync(smallImagePath, smallImageBuffer);
  
  // Create a large audio file (25MB)
  const largeAudioPath = path.join(tempDir, 'large-audio.wav');
  const largeAudioBuffer = Buffer.alloc(25 * 1024 * 1024, 'B');
  fs.writeFileSync(largeAudioPath, largeAudioBuffer);
  
  try {
    const storageManager = new StorageManager();
    
    // Test small image upload (should use Supabase)
    const smallResult = await storageManager.uploadFile({
      name: 'small-image.jpg',
      type: 'image/jpeg',
      size: smallImageBuffer.length,
      buffer: smallImageBuffer
    }, {
      path: 'test/small-image.jpg'
    });
    
    console.log('Small file upload result:', smallResult);
    
    // Test large audio upload (should use FTP)
    const largeResult = await storageManager.uploadFile({
      name: 'large-audio.wav',
      type: 'audio/wav',
      size: largeAudioBuffer.length,
      buffer: largeAudioBuffer
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

// Run the test
testHybridStorage().catch(console.error);
