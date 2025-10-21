const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables');
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
      .from('promo_pages')
      .select('id')
      .limit(1);
    
    if (promoError && promoError.code === 'PGRST106') {
      // Table doesn't exist, we'll create it manually in Supabase dashboard
      console.log('⚠️  promo_pages table needs to be created in Supabase dashboard');
    } else {
      console.log('✅ promo_pages table exists');
    }
    
    // Test artwork generations table
    const { error: artworkError } = await supabase
      .from('artwork_generations')
      .select('id')
      .limit(1);
    
    if (artworkError && artworkError.code === 'PGRST106') {
      console.log('⚠️  artwork_generations table needs to be created in Supabase dashboard');
    } else {
      console.log('✅ artwork_generations table exists');
    }
    
    // Test songscan requests table
    const { error: songscanError } = await supabase
      .from('songscan_requests')
      .select('id')
      .limit(1);
    
    if (songscanError && songscanError.code === 'PGRST106') {
      console.log('⚠️  songscan_requests table needs to be created in Supabase dashboard');
    } else {
      console.log('✅ songscan_requests table exists');
    }
    
    console.log('');
    console.log('📝 To create missing tables, run this SQL in your Supabase dashboard:');
    console.log('');
    console.log(`
-- Create promo pages table
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

-- Create artwork generations table
CREATE TABLE IF NOT EXISTS artwork_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT,
  parameters JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create SongScan requests table  
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

-- Enable RLS
ALTER TABLE promo_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE songscan_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own promo pages" ON promo_pages FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own artwork generations" ON artwork_generations FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own songscan requests" ON songscan_requests FOR ALL USING (user_id = auth.uid());

-- Create storage bucket for generated artwork
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-artwork', 'generated-artwork', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload their own generated artwork" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'generated-artwork' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view generated artwork" ON storage.objects FOR SELECT USING (bucket_id = 'generated-artwork');
    `);
    
    console.log('');
    console.log('🎉 Database setup instructions displayed!');
    
  } catch (error) {
    console.error('❌ Failed to check tables:', error.message);
  }
}

setupTables();
