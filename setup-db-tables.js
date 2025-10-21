const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupTables() {
  try {
    console.log('🎨 Setting up artist tools database tables...');
    
    // Create promo pages table
    console.log('Creating promo_pages table...');
    const { error: promoError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'promo_pages')
      .single();
    
    if (promoError) {
      const { error } = await supabase.rpc('exec', {
        sql_query: `
        CREATE TABLE IF NOT EXISTS promo_pages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          bio TEXT,
          social_links JSONB DEFAULT '{}',
          slug VARCHAR(255) UNIQUE NOT NULL,
          is_active BOOLEAN DEFAULT true,
          view_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE promo_pages ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can manage own promo pages" ON promo_pages
          FOR ALL USING (user_id = auth.uid());
        `
      });
      
      if (error) throw error;
      console.log('✅ promo_pages table created');
    }
    
    // Create artwork generations table
    console.log('Creating artwork_generations table...');
    const { error: artworkError } = await supabase.rpc('exec', {
      sql_query: `
      CREATE TABLE IF NOT EXISTS artwork_generations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        prompt TEXT NOT NULL,
        image_url TEXT,
        parameters JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      ALTER TABLE artwork_generations ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can manage own artwork generations" ON artwork_generations
        FOR ALL USING (user_id = auth.uid());
      `
    });
    
    if (artworkError) throw artworkError;
    console.log('✅ artwork_generations table created');
    
    // Create songscan requests table
    console.log('Creating songscan_requests table...');
    const { error: songscanError } = await supabase.rpc('exec', {
      sql_query: `
      CREATE TABLE IF NOT EXISTS songscan_requests (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        release_id UUID NOT NULL,
        release_title VARCHAR(255) NOT NULL,
        artist_name VARCHAR(255) NOT NULL,
        upc VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        songscan_id VARCHAR(100),
        requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        processed_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB DEFAULT '{}'
      );
      
      ALTER TABLE songscan_requests ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can manage own songscan requests" ON songscan_requests
        FOR ALL USING (user_id = auth.uid());
      `
    });
    
    if (songscanError) throw songscanError;
    console.log('✅ songscan_requests table created');
    
    console.log('🎉 Artist tools database setup complete!');
    
  } catch (error) {
    console.error('❌ Failed to setup tables:', error.message);
    process.exit(1);
  }
}

setupTables();
