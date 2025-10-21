// Check promo_pages table
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPromoTable() {
  console.log('🔍 Checking promo_pages table...');
  
  try {
    // First, try to select from the table
    const { data, error } = await supabase
      .from('promo_pages')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ promo_pages table does not exist');
        console.log('Creating promo_pages table...');
        
        // Create the table
        const { error: createError } = await supabase.rpc('create_promo_pages_table', {});
        
        if (createError) {
          console.error('Error creating table with RPC:', createError);
          console.log('Trying direct SQL...');
          
          // Try direct SQL
          const { error: sqlError } = await supabase
            .from('_sql')
            .insert({
              query: `
                CREATE TABLE IF NOT EXISTS promo_pages (
                  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                  title TEXT NOT NULL,
                  bio TEXT,
                  social_links JSONB,
                  slug TEXT UNIQUE NOT NULL,
                  is_active BOOLEAN DEFAULT true,
                  view_count INTEGER DEFAULT 0,
                  created_at TIMESTAMPTZ DEFAULT NOW(),
                  updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS promo_pages_user_id_idx ON promo_pages(user_id);
                CREATE INDEX IF NOT EXISTS promo_pages_slug_idx ON promo_pages(slug);
                
                -- Enable RLS
                ALTER TABLE promo_pages ENABLE ROW LEVEL SECURITY;
                
                -- Users can see their own promo pages
                CREATE POLICY "Users can view own promo pages" ON promo_pages
                  FOR SELECT USING (auth.uid() = user_id);
                
                -- Users can create their own promo pages
                CREATE POLICY "Users can create promo pages" ON promo_pages
                  FOR INSERT WITH CHECK (auth.uid() = user_id);
                
                -- Users can update their own promo pages
                CREATE POLICY "Users can update own promo pages" ON promo_pages
                  FOR UPDATE USING (auth.uid() = user_id);
                
                -- Anyone can view active promo pages by slug (public access)
                CREATE POLICY "Public can view active promo pages" ON promo_pages
                  FOR SELECT USING (is_active = true);
              `
            });
          
          if (sqlError) {
            console.error('Error with SQL creation:', sqlError);
          } else {
            console.log('✅ Table created with SQL');
          }
        } else {
          console.log('✅ Table created with RPC');
        }
      } else {
        console.error('Other error accessing table:', error.message);
      }
    } else {
      console.log('✅ promo_pages table exists and accessible');
      console.log('Sample data:', data);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkPromoTable();
