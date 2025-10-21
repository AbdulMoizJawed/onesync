#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the main project
dotenv.config({ path: path.join(process.cwd(), '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdminBucket() {
  console.log('🔧 Setting up admin content bucket...');
  
  try {
    // Create the admin-content bucket
    const { data, error } = await supabase.storage.createBucket('admin-content', {
      public: true,
      allowedMimeTypes: ['image/*', 'application/pdf', 'text/*', 'application/json'],
      fileSizeLimit: 10485760 // 10MB
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ admin-content bucket already exists');
      } else {
        console.error('❌ Error creating bucket:', error.message);
        return;
      }
    } else {
      console.log('✅ admin-content bucket created successfully');
    }

    // Create some initial folders
    const initialFolders = [
      'releases/',
      'artists/', 
      'documents/',
      'exports/'
    ];

    for (const folder of initialFolders) {
      const { error: uploadError } = await supabase.storage
        .from('admin-content')
        .upload(`${folder}.gitkeep`, new Blob([''], { type: 'text/plain' }));

      if (uploadError && !uploadError.message.includes('already exists')) {
        console.log(`⚠️  Could not create folder ${folder}:`, uploadError.message);
      } else {
        console.log(`✅ Created folder: ${folder}`);
      }
    }

    console.log('🎉 Admin bucket setup completed!');
    console.log('📋 Bucket details:');
    console.log('   - Name: admin-content');
    console.log('   - Public: Yes');
    console.log('   - Max file size: 10MB');
    console.log('   - Allowed types: Images, PDFs, Text files, JSON');

  } catch (error) {
    console.error('❌ Error setting up admin bucket:', error);
  }
}

setupAdminBucket();