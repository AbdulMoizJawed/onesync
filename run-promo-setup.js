const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createPromoTable() {
  try {
    console.log('Creating promo_pages table...')
    
    // Step 1: Create the table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.promo_pages (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        bio TEXT,
        social_links JSONB DEFAULT '{}',
        slug TEXT NOT NULL UNIQUE,
        short_url TEXT,
        is_active BOOLEAN DEFAULT true,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    const { error: tableError } = await supabase.rpc('exec', { 
      sql: createTableSQL 
    })
    
    if (tableError) {
      // Try alternative method - direct SQL execution via supabase-js
      console.log('RPC failed, trying direct approach...')
      
      // Create table using individual operations
      const { error } = await supabase
        .from('promo_pages')
        .select('id')
        .limit(1)
      
      if (error && error.code === '42P01') {
        console.log('Table does not exist, creating manually...')
        console.log('Please run this SQL in your Supabase SQL Editor:')
        console.log('\n--- COPY AND PASTE THIS SQL ---')
        console.log(createTableSQL)
        console.log('\n--- ALSO ADD THESE INDEXES AND POLICIES ---')
        console.log(`
-- Create indexes
CREATE INDEX IF NOT EXISTS idx_promo_pages_user_id ON public.promo_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_pages_slug ON public.promo_pages(slug);
CREATE INDEX IF NOT EXISTS idx_promo_pages_is_active ON public.promo_pages(is_active);

-- Enable RLS
ALTER TABLE public.promo_pages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY IF NOT EXISTS "Users can view their own promo pages" ON public.promo_pages
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY IF NOT EXISTS "Users can insert their own promo pages" ON public.promo_pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY IF NOT EXISTS "Users can update their own promo pages" ON public.promo_pages
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY IF NOT EXISTS "Users can delete their own promo pages" ON public.promo_pages
  FOR DELETE USING (auth.uid() = user_id);
  
-- Allow public access to promo pages by slug (for public viewing)
CREATE POLICY IF NOT EXISTS "Public can view active promo pages by slug" ON public.promo_pages
  FOR SELECT USING (is_active = true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_promo_pages_updated_at ON public.promo_pages;
CREATE TRIGGER update_promo_pages_updated_at
  BEFORE UPDATE ON public.promo_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
        `)
        return
      } else if (!error) {
        console.log('✅ Table already exists!')
        return
      }
    } else {
      console.log('✅ Successfully created promo_pages table')
    }
    
  } catch (error) {
    console.error('Script error:', error)
    console.log('\nManual Setup Required:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Select your project')
    console.log('3. Go to SQL Editor')
    console.log('4. Copy and paste the SQL from setup-promo-pages-table.sql')
    console.log('5. Run the SQL')
  }
}

createPromoTable()
