const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createPublishingRequestsTable() {
  console.log('🔄 Creating publishing_requests table...')

  try {
    // First, let's just check if the table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('publishing_requests')
      .select('id')
      .limit(1)

    if (!checkError) {
      console.log('✅ Publishing requests table already exists')
      return true
    }

    console.log('📋 Table does not exist, creating it via SQL...')
    
    // Since we can't use exec_sql, let's create a simple entry to test the connection
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      
    if (testError) {
      console.error('❌ Database connection test failed:', testError)
      return false
    }
    
    console.log('✅ Database connection works, but we need to create the table manually in Supabase dashboard')
    console.log('🔧 Please run this SQL in your Supabase SQL editor:')
    console.log(`
-- Create publishing_requests table for tracking publishing administration requests
CREATE TABLE IF NOT EXISTS publishing_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_publishing_requests_user_id ON publishing_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_publishing_requests_status ON publishing_requests(status);
CREATE INDEX IF NOT EXISTS idx_publishing_requests_requested_at ON publishing_requests(requested_at);

-- Add RLS policies
ALTER TABLE publishing_requests ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own requests  
CREATE POLICY "Users can view own publishing requests" ON publishing_requests
  FOR SELECT USING (auth.uid() = user_id);
  
-- Policy for users to insert their own requests
CREATE POLICY "Users can create publishing requests" ON publishing_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
`)
    
    return true
  } catch (err) {
    console.error('💥 Exception:', err)
    return false
  }
}

createPublishingRequestsTable()
  .then(success => {
    if (success) {
      console.log('🎉 Publishing requests table setup complete!')
    } else {
      console.log('💥 Publishing requests table setup failed!')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(err => {
    console.error('💥 Exception:', err)
    process.exit(1)
  })
