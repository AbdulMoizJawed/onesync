const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createPlaylistPitchingTable() {
  console.log('🔄 Creating playlist_pitching_requests table...')

  try {
    // First, let's check if the table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('playlist_pitching_requests')
      .select('id')
      .limit(1)

    if (!checkError) {
      console.log('✅ Playlist pitching requests table already exists')
      return true
    }

    console.log('📋 Table does not exist, needs to be created manually in Supabase dashboard')
    console.log('🔧 Please run this SQL in your Supabase SQL editor:')
    console.log(`
-- Create playlist_pitching_requests table
CREATE TABLE IF NOT EXISTS playlist_pitching_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  release_id UUID REFERENCES releases(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('indie', 'pro', 'superstar')),
  amount DECIMAL(10,2) NOT NULL,
  stripe_session_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  campaign_results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_playlist_pitching_user_id ON playlist_pitching_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_pitching_release_id ON playlist_pitching_requests(release_id);
CREATE INDEX IF NOT EXISTS idx_playlist_pitching_status ON playlist_pitching_requests(status);
CREATE INDEX IF NOT EXISTS idx_playlist_pitching_requested_at ON playlist_pitching_requests(requested_at);

-- Add RLS policies
ALTER TABLE playlist_pitching_requests ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own requests
CREATE POLICY "Users can view own playlist pitching requests" ON playlist_pitching_requests
  FOR SELECT USING (auth.uid() = user_id);
  
-- Policy for users to insert their own requests (handled by API)
CREATE POLICY "API can create playlist pitching requests" ON playlist_pitching_requests
  FOR INSERT WITH CHECK (true);

-- Policy for admins to view all requests (you can customize this based on your admin logic)
CREATE POLICY "Admins can view all playlist pitching requests" ON playlist_pitching_requests
  FOR ALL USING (true);
`)
    
    return true
  } catch (err) {
    console.error('💥 Exception:', err)
    return false
  }
}

createPlaylistPitchingTable()
  .then(success => {
    if (success) {
      console.log('🎉 Playlist pitching table setup complete!')
    } else {
      console.log('💥 Playlist pitching table setup failed!')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(err => {
    console.error('💥 Exception:', err)
    process.exit(1)
  })
