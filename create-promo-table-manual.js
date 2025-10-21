// Create promo_pages table directly
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPromoTable() {
  console.log('🚀 Creating promo_pages table...');
  
  try {
    // Try a simple create approach using the admin client
    console.log('Creating table with admin permissions...');
    
    // Create the table using a workaround
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'promo_pages')
      .single();
    
    if (error && error.details?.includes('Results contain 0 rows')) {
      console.log('Table does not exist, creating it...');
      
      // Manual approach - create a temporary function to execute DDL
      const createSql = `
        -- Create the table
        CREATE TABLE promo_pages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          bio TEXT,
          social_links JSONB DEFAULT '{}',
          slug TEXT UNIQUE NOT NULL,
          is_active BOOLEAN DEFAULT true,
          view_count INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX promo_pages_user_id_idx ON promo_pages(user_id);
        CREATE INDEX promo_pages_slug_idx ON promo_pages(slug);

        -- Enable RLS
        ALTER TABLE promo_pages ENABLE ROW LEVEL SECURITY;

        -- Policies
        CREATE POLICY "Users can view own promo pages" ON promo_pages
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can create promo pages" ON promo_pages
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own promo pages" ON promo_pages
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Public can view active promo pages" ON promo_pages
          FOR SELECT USING (is_active = true);
      `;
      
      console.log('The table needs to be created manually in Supabase SQL Editor.');
      console.log('Please go to your Supabase dashboard > SQL Editor and run this SQL:');
      console.log('\n' + '='.repeat(80));
      console.log(createSql);
      console.log('='.repeat(80) + '\n');
      
      // For now, let's create a mock success response
      console.log('✅ SQL provided for manual execution');
      
    } else {
      console.log('✅ promo_pages table already exists');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    
    // Provide the SQL for manual execution
    console.log('\nPlease run this SQL in your Supabase SQL Editor:');
    console.log('='.repeat(80));
    console.log(`
-- Create promo_pages table
CREATE TABLE IF NOT EXISTS promo_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  bio TEXT,
  social_links JSONB DEFAULT '{}',
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS promo_pages_user_id_idx ON promo_pages(user_id);
CREATE INDEX IF NOT EXISTS promo_pages_slug_idx ON promo_pages(slug);

-- Enable RLS
ALTER TABLE promo_pages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own promo pages" ON promo_pages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create promo pages" ON promo_pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own promo pages" ON promo_pages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public can view active promo pages" ON promo_pages
  FOR SELECT USING (is_active = true);
    `);
    console.log('='.repeat(80));
  }
}

createPromoTable();
