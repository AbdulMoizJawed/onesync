require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createStorageTrackingTable() {
  console.log('🔄 Creating storage tracking table');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // First check if the table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('storage_tracking')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.message.includes('does not exist')) {
      console.log('Creating storage_tracking table...');
      
      // Create storage_tracking table with minimal structure
      const storageTrackingTable = `
        CREATE TABLE IF NOT EXISTS storage_tracking (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          file_path TEXT NOT NULL,
          storage_type TEXT NOT NULL,
          bucket TEXT,
          remote_path TEXT,
          public_url TEXT,
          file_size BIGINT,
          content_type TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      console.log('Please run the following SQL in your Supabase dashboard:');
      console.log(storageTrackingTable);
      console.log('For now, the hybrid storage system will work with limited tracking.');
    } else {
      console.log('✅ Storage tracking table already exists');
    }
    
    // Check for storage_info column in releases table
    try {
      const { data: releaseCheck, error: releaseError } = await supabase
        .from('releases')
        .select('storage_info')
        .limit(1);
      
      if (releaseError && releaseError.message.includes('storage_info')) {
        console.log('⚠️ storage_info column does not exist in releases table');
        console.log('Please run the following SQL in your Supabase dashboard:');
        console.log('ALTER TABLE releases ADD COLUMN IF NOT EXISTS storage_info JSONB DEFAULT NULL;');
      } else {
        console.log('✅ storage_info column exists in releases table');
      }
    } catch (error) {
      console.log('⚠️ Could not check releases table schema:', error.message);
    }
    
    console.log('✅ Database migration check completed');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

createStorageTrackingTable().catch(console.error);
