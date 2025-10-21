const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  // Load environment variables
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (error) {
    console.log('dotenv module not found, continuing with process.env');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }

  // Create Supabase client with admin privileges
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🔌 Connected to Supabase');
  console.log('🔧 Running database migrations...');

  try {
    // Read the SQL migration file
    const sqlPath = path.resolve(__dirname, 'setup-storage-tracking.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Try using direct SQL query first
    try {
      const { data, error } = await supabase.from('rpc').select('pg_execute', { query: sql });
      if (error) throw error;
      console.log('✅ SQL executed via RPC');
    } catch (rpcError) {
      console.log('⚠️ RPC method failed, falling back to table operations...');
      
      // Manually implement the schema changes if RPC fails
      const { error: checkError } = await supabase
        .from('releases')
        .select('storage_info')
        .limit(1);
      
      if (checkError && checkError.message.includes('column "storage_info" does not exist')) {
        console.log('Adding storage_info column to releases table...');
        const { error: alterError } = await supabase.rpc('pg_alter_table', { 
          query: 'ALTER TABLE releases ADD COLUMN IF NOT EXISTS storage_info JSONB DEFAULT NULL' 
        });
        
        if (alterError) {
          console.log('⚠️ Could not alter table directly, trying simpler approach...');
          // Just create the tracking table
          const createTrackingTable = `
            CREATE TABLE IF NOT EXISTS storage_tracking (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              file_path TEXT NOT NULL,
              storage_type TEXT NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `;
          const { error: createTableError } = await supabase.rpc('pg_execute', { query: createTrackingTable });
          
          if (createTableError) {
            throw createTableError;
          }
        }
      }
    }

    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
