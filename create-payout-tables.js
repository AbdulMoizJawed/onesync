const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createPayoutTables() {
  console.log('Creating payout tables...\n');
  
  try {
    // Create payout_methods table
    console.log('Creating payout_methods table...');
    const { error: methodsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS payout_methods (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          method_type TEXT NOT NULL CHECK (method_type IN ('paypal', 'bank_transfer', 'crypto')),
          is_primary BOOLEAN DEFAULT false,
          paypal_email TEXT,
          account_holder_name TEXT,
          account_number TEXT,
          routing_number TEXT,
          bank_name TEXT,
          crypto_currency TEXT,
          wallet_address TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, is_primary) WHERE is_primary = true
        );
        
        -- Enable RLS
        ALTER TABLE payout_methods ENABLE ROW LEVEL SECURITY;
        
        -- Create policy
        CREATE POLICY "Users can manage their own payout methods" ON payout_methods
          FOR ALL USING (auth.uid() = user_id);
      `
    });
    
    if (methodsError) {
      console.error('Error creating payout_methods:', methodsError);
    } else {
      console.log('✅ payout_methods table created');
    }
    
    // Create payout_requests table
    console.log('Creating payout_requests table...');
    const { error: requestsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS payout_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          payout_method_id UUID NOT NULL REFERENCES payout_methods(id) ON DELETE CASCADE,
          amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
          payment_method TEXT,
          failure_reason TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          processed_at TIMESTAMPTZ
        );
        
        -- Enable RLS
        ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
        
        -- Create policy
        CREATE POLICY "Users can view their own payout requests" ON payout_requests
          FOR ALL USING (auth.uid() = user_id);
      `
    });
    
    if (requestsError) {
      console.error('Error creating payout_requests:', requestsError);
    } else {
      console.log('✅ payout_requests table created');
    }
    
    console.log('\n🎉 Payout tables setup complete!');
    
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

createPayoutTables();
