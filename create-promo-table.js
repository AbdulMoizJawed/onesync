const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createPromoTable() {
  try {
    console.log('Creating promo_pages table...')
    
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
    `
    
    // Execute the SQL using a direct query
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (error) {
      console.error('Error creating table via RPC:', error)
      console.log('\nPlease run this SQL manually in Supabase SQL Editor:')
      console.log(createTableSQL)
    } else {
      console.log('✅ Successfully created promo_pages table with all policies')
    }
    
  } catch (error) {
    console.error('Script error:', error)
    console.log('\nIf the RPC method fails, please run the SQL manually in Supabase:')
    console.log(`
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
    `)
  }
}

createPromoTable()
