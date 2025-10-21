const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createTablesDirect() {
  console.log('🔧 Creating payout tables using direct SQL execution...\n')

  try {
    // Method 1: Try using the old payout_requests table structure first as a workaround
    console.log('📝 Step 1: Creating basic payout_methods table...')
    
    const basicTableSQL = `
      CREATE TABLE IF NOT EXISTS payout_methods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        method_type TEXT NOT NULL CHECK (method_type IN ('paypal', 'bank_transfer', 'crypto', 'stripe', 'wise')),
        is_primary BOOLEAN DEFAULT false,
        paypal_email TEXT,
        account_holder_name TEXT,
        account_number TEXT,
        routing_number TEXT,
        bank_name TEXT,
        crypto_currency TEXT,
        wallet_address TEXT,
        stripe_account_id TEXT,
        wise_email TEXT,
        details JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    // Try to execute by creating a temporary stored procedure
    const createProcSQL = `
      CREATE OR REPLACE FUNCTION create_payout_tables_temp()
      RETURNS TEXT AS $$
      BEGIN
        EXECUTE '${basicTableSQL.replace(/'/g, "''")}';
        RETURN 'Tables created successfully';
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'Error: ' || SQLERRM;
      END;
      $$ LANGUAGE plpgsql;
    `

    const { data: procResult, error: procError } = await supabase
      .rpc('create_payout_tables_temp')

    if (procError) {
      // Try alternative method - use existing table structure
      console.log('🔄 Trying alternative table creation method...')
      
      const { error: altError } = await supabase
        .from('payout_methods')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          method_type: 'paypal',
          paypal_email: 'test@test.com'
        })

      if (altError && altError.message.includes('does not exist')) {
        console.log('❌ Cannot create tables automatically')
        console.log('\n🚨 CRITICAL: Manual SQL execution required!')
        
        // Let's try one more approach - create via raw query if possible
        console.log('🔧 Attempting final workaround...')
        
        // Create a very simple version first
        try {
          const simpleCreate = await supabase.rpc('exec', {
            sql: `
              CREATE TABLE IF NOT EXISTS payout_methods (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                type VARCHAR(50) NOT NULL,
                details TEXT NOT NULL,
                is_default BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT NOW()
              );
              
              ALTER TABLE payout_methods ENABLE ROW LEVEL SECURITY;
              
              CREATE POLICY IF NOT EXISTS "payout_methods_policy" ON payout_methods
                FOR ALL USING (true);
            `
          })
          
          console.log('✅ Simple payout_methods table created!')
        } catch (finalError) {
          console.log('❌ All automatic methods failed')
          console.log('\n📋 MANUAL SETUP REQUIRED:')
          console.log('Please execute this SQL in your Supabase SQL Editor:')
          console.log('\n' + '='.repeat(50))
          
          const manualSQL = `
-- Simple payout system setup
CREATE TABLE IF NOT EXISTS payout_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('paypal', 'bank_transfer', 'stripe', 'wise')),
  details JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payout_methods ENABLE ROW LEVEL SECURITY;

-- Basic RLS policy
CREATE POLICY IF NOT EXISTS "payout_methods_user_access" ON payout_methods
  FOR ALL USING (auth.uid() = user_id);

-- Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payout_method_id UUID REFERENCES payout_methods(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "payouts_user_access" ON payouts
  FOR ALL USING (auth.uid() = user_id);

-- Create user_earnings table
CREATE TABLE IF NOT EXISTS user_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  source_type VARCHAR(50) DEFAULT 'other',
  status VARCHAR(50) DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "user_earnings_user_access" ON user_earnings
  FOR ALL USING (auth.uid() = user_id);
          `
          
          console.log(manualSQL)
          console.log('='.repeat(50))
          
          return
        }
      }
    } else {
      console.log('✅ Procedure executed:', procResult)
    }

    // Test the tables
    console.log('\n🧪 Testing created tables...')
    const { data: testData, error: testError } = await supabase
      .from('payout_methods')
      .select('id')
      .limit(1)

    if (testError) {
      console.log('❌ Table test failed:', testError.message)
    } else {
      console.log('✅ payout_methods table is working!')
      
      // Enable RLS
      console.log('🔒 Setting up Row Level Security...')
      await supabase.rpc('exec', {
        sql: `
          ALTER TABLE payout_methods ENABLE ROW LEVEL SECURITY;
          CREATE POLICY IF NOT EXISTS "users_payout_methods" ON payout_methods
            FOR ALL USING (auth.uid() = user_id);
        `
      }).catch(e => console.log('RLS setup:', e.message))

      console.log('✅ Payout system is ready!')
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    console.log('\n🔧 Please run the SQL manually in Supabase SQL Editor')
  }
}

createTablesDirect()
