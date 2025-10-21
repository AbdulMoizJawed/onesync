const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const createTablesSql = `
-- Create payout_requests table
CREATE TABLE IF NOT EXISTS payout_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    artist_id UUID,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    payment_details JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create takedown_requests table  
CREATE TABLE IF NOT EXISTS takedown_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_url TEXT NOT NULL,
    platform TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    contact_info TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    internal_notes JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create sync_requests table
CREATE TABLE IF NOT EXISTS sync_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    release_id UUID,
    project_name TEXT NOT NULL,
    usage_type TEXT NOT NULL,
    budget DECIMAL(10,2),
    deadline DATE,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'negotiating')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE takedown_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payout_requests
CREATE POLICY "Users can view own payout requests" ON payout_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payout requests" ON payout_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for takedown_requests
CREATE POLICY "Users can view own takedown requests" ON takedown_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own takedown requests" ON takedown_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for sync_requests
CREATE POLICY "Users can view own sync requests" ON sync_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync requests" ON sync_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS payout_requests_user_id_idx ON payout_requests(user_id);
CREATE INDEX IF NOT EXISTS payout_requests_status_idx ON payout_requests(status);

CREATE INDEX IF NOT EXISTS takedown_requests_user_id_idx ON takedown_requests(user_id);
CREATE INDEX IF NOT EXISTS takedown_requests_status_idx ON takedown_requests(status);

CREATE INDEX IF NOT EXISTS sync_requests_user_id_idx ON sync_requests(user_id);
CREATE INDEX IF NOT EXISTS sync_requests_status_idx ON sync_requests(status);
`;

async function createMissingTables() {
  console.log('Creating missing admin tables...');
  
  try {
    // Execute the entire SQL block
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: createTablesSql 
    });
    
    if (error) {
      console.error('Error creating tables:', error);
    } else {
      console.log('✅ Tables created successfully!', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

createMissingTables().catch(console.error);
