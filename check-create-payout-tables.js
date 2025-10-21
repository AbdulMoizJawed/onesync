const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAndCreatePayoutTables() {
  try {
    console.log('🔍 Checking for payout-related tables...\n')
    
    // Check for payout_methods table
    const { data: payoutMethods, error: payoutMethodsError } = await supabase
      .from('payout_methods')
      .select('*')
      .limit(1)
    
    if (payoutMethodsError) {
      console.log('❌ payout_methods table not found:', payoutMethodsError.message)
      await createPayoutMethodsTable()
    } else {
      console.log('✅ payout_methods table exists')
    }

    // Check for payouts table
    const { data: payouts, error: payoutsError } = await supabase
      .from('payouts')
      .select('*')
      .limit(1)
    
    if (payoutsError) {
      console.log('❌ payouts table not found:', payoutsError.message)
      await createPayoutsTable()
    } else {
      console.log('✅ payouts table exists')
    }

    // Check for user_earnings table
    const { data: userEarnings, error: userEarningsError } = await supabase
      .from('user_earnings')
      .select('*')
      .limit(1)
    
    if (userEarningsError) {
      console.log('❌ user_earnings table not found:', userEarningsError.message)
      await createUserEarningsTable()
    } else {
      console.log('✅ user_earnings table exists')
    }

    console.log('\n🎉 Payout system tables check completed!')

  } catch (error) {
    console.error('❌ Error checking tables:', error)
  }
}

async function createPayoutMethodsTable() {
  console.log('📝 Creating payout_methods table...')
  
  const { error } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS payout_methods (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('paypal', 'bank_transfer', 'stripe', 'wise')),
        is_default BOOLEAN DEFAULT FALSE,
        details JSONB NOT NULL, -- Store payment method specific details
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create index for faster lookups
      CREATE INDEX IF NOT EXISTS idx_payout_methods_user_id ON payout_methods(user_id);
      CREATE INDEX IF NOT EXISTS idx_payout_methods_default ON payout_methods(user_id, is_default) WHERE is_default = true;
      
      -- RLS policies
      ALTER TABLE payout_methods ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "Users can view own payout methods" ON payout_methods
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Users can insert own payout methods" ON payout_methods
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Users can update own payout methods" ON payout_methods
        FOR UPDATE USING (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Users can delete own payout methods" ON payout_methods
        FOR DELETE USING (auth.uid() = user_id);
      
      -- Admin policies
      CREATE POLICY IF NOT EXISTS "Admins can view all payout methods" ON payout_methods
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
          )
        );
    `
  })

  if (error) {
    console.error('❌ Error creating payout_methods table:', error)
  } else {
    console.log('✅ payout_methods table created successfully')
  }
}

async function createPayoutsTable() {
  console.log('📝 Creating payouts table...')
  
  const { error } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS payouts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        payout_method_id UUID NOT NULL REFERENCES payout_methods(id) ON DELETE RESTRICT,
        amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
        reference_id VARCHAR(255), -- External payment processor reference
        failure_reason TEXT,
        requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        processed_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
      CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
      CREATE INDEX IF NOT EXISTS idx_payouts_requested_at ON payouts(requested_at DESC);
      
      -- RLS policies
      ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "Users can view own payouts" ON payouts
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Users can insert own payouts" ON payouts
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      -- Admin policies
      CREATE POLICY IF NOT EXISTS "Admins can view all payouts" ON payouts
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
          )
        );
    `
  })

  if (error) {
    console.error('❌ Error creating payouts table:', error)
  } else {
    console.log('✅ payouts table created successfully')
  }
}

async function createUserEarningsTable() {
  console.log('📝 Creating user_earnings table...')
  
  const { error } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS user_earnings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('streaming', 'beat_sales', 'sync_opportunities', 'royalties')),
        source_id UUID, -- Reference to the specific source (release, beat, sync, etc.)
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        period_start DATE,
        period_end DATE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid_out')),
        payout_id UUID REFERENCES payouts(id) ON DELETE SET NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_user_earnings_user_id ON user_earnings(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_earnings_status ON user_earnings(status);
      CREATE INDEX IF NOT EXISTS idx_user_earnings_source ON user_earnings(source_type, source_id);
      CREATE INDEX IF NOT EXISTS idx_user_earnings_period ON user_earnings(period_start, period_end);
      
      -- RLS policies
      ALTER TABLE user_earnings ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "Users can view own earnings" ON user_earnings
        FOR SELECT USING (auth.uid() = user_id);
      
      -- Admin policies
      CREATE POLICY IF NOT EXISTS "Admins can view all earnings" ON user_earnings
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
          )
        );
    `
  })

  if (error) {
    console.error('❌ Error creating user_earnings table:', error)
  } else {
    console.log('✅ user_earnings table created successfully')
  }
}

// Run the check
checkAndCreatePayoutTables()
