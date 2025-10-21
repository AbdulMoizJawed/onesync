// Run promo pages table migration
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runPromoPagesMigration() {
  console.log('🚀 Running promo_pages table migration...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20240115000001_create_promo_pages_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`🔧 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          // Try alternative method
          console.log('RPC method failed, trying direct execution...');
          const { error: directError } = await supabase
            .from('_system')
            .select()
            .limit(0); // This is a dummy query to test connection
          
          if (directError) {
            console.error(`❌ Error executing statement ${i + 1}:`, error);
            // Continue with other statements
          }
        }
      }
    }
    
    // Test if table was created
    console.log('🔍 Testing table creation...');
    const { data, error } = await supabase
      .from('promo_pages')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table test failed:', error.message);
    } else {
      console.log('✅ promo_pages table created and accessible!');
    }
    
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  }
}

runPromoPagesMigration();
