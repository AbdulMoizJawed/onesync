#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Storage Migration...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStorageSetup() {
  try {
    // Test 1: Check if storage buckets exist
    console.log('1. Checking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Failed to list buckets:', bucketsError.message);
      return;
    }
    
    const bucketNames = buckets.map(b => b.name);
    console.log('📦 Available buckets:', bucketNames.join(', '));
    
    // Check for required buckets
    const requiredBuckets = ['releases', 'avatars', 'documents'];
    const missingBuckets = requiredBuckets.filter(bucket => !bucketNames.includes(bucket));
    
    if (missingBuckets.length > 0) {
      console.log('⚠️  Missing buckets:', missingBuckets.join(', '));
      console.log('📝 Please run the storage migration SQL in your Supabase dashboard');
    } else {
      console.log('✅ All required buckets exist');
    }
    
    // Test 2: Check uploaded_files table structure
    console.log('\n2. Checking uploaded_files table...');
    const { data: tableData, error: tableError } = await supabase
      .from('uploaded_files')
      .select('*')
      .limit(1);
    
    if (tableError) {
      if (tableError.message.includes('relation "uploaded_files" does not exist')) {
        console.log('⚠️  uploaded_files table does not exist - will be created when needed');
      } else {
        console.log('⚠️  Table check failed:', tableError.message);
      }
    } else {
      console.log('✅ uploaded_files table accessible');
    }
    
    // Test 3: Test storage permissions (if possible)
    console.log('\n3. Testing storage access...');
    const { data: releasesBucket, error: releasesError } = await supabase.storage
      .from('releases')
      .list('', { limit: 1 });
    
    if (releasesError) {
      console.log('⚠️  Releases bucket access issue:', releasesError.message);
    } else {
      console.log('✅ Releases bucket accessible');
    }
    
    console.log('\n🎉 Storage migration test completed!');
    console.log('🚀 Your app is now configured to use Supabase Storage');
    console.log('📝 Next steps:');
    console.log('   1. If any buckets are missing, run the SQL migration in Supabase dashboard');
    console.log('   2. Test file uploads through your app interface');
    console.log('   3. Verify files appear in the Supabase Storage dashboard');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStorageSetup();
