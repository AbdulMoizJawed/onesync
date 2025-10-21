const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createPayoutTables() {
  try {
    console.log('🚀 Creating comprehensive payout system tables...\n')

    // Create payout_methods table
    console.log('📝 Creating payout_methods table...')
    const { error: payoutMethodsError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'payout_methods')
      .single()

    if (payoutMethodsError && payoutMethodsError.code === 'PGRST116') {
      // Table doesn't exist, create it
      const createPayoutMethodsSQL = `
        CREATE TABLE payout_methods (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL CHECK (type IN ('paypal', 'bank_transfer', 'stripe', 'wise')),
          is_default BOOLEAN DEFAULT FALSE,
          details JSONB NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_payout_methods_user_id ON payout_methods(user_id);
        CREATE INDEX idx_payout_methods_default ON payout_methods(user_id, is_default) WHERE is_default = true;
        
        ALTER TABLE payout_methods ENABLE ROW LEVEL SECURITY;
      `
      
      // Since we can't use exec_sql, let's try using the raw query method
      const { error: createError } = await supabase.rpc('exec', { sql: createPayoutMethodsSQL })
      
      if (createError) {
        console.log('Attempting alternative method to create tables...')
        // Create the table by inserting a dummy record and catching the error
        const { error: insertError } = await supabase
          .from('payout_methods')
          .insert([{
            user_id: '00000000-0000-0000-0000-000000000000',
            type: 'paypal',
            details: { email: 'test@test.com' }
          }])
        
        console.log('Insert attempt result (expected to fail):', insertError?.message)
      } else {
        console.log('✅ payout_methods table created successfully')
      }
    } else {
      console.log('✅ payout_methods table already exists')
    }

    // Test if we can access the table now
    const { data: testData, error: testError } = await supabase
      .from('payout_methods')
      .select('id')
      .limit(1)

    if (testError) {
      console.log('❌ Cannot access payout_methods table:', testError.message)
      console.log('\n🔧 MANUAL SETUP REQUIRED:')
      console.log('Please run the following SQL in your Supabase SQL Editor:')
      console.log(`
-- 1. Create payout_methods table
CREATE TABLE IF NOT EXISTS payout_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('paypal', 'bank_transfer', 'stripe', 'wise')),
  is_default BOOLEAN DEFAULT FALSE,
  details JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_methods_user_id ON payout_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_methods_default ON payout_methods(user_id, is_default) WHERE is_default = true;

ALTER TABLE payout_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY IF NOT EXISTS "Users can view own payout methods" ON payout_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own payout methods" ON payout_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own payout methods" ON payout_methods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own payout methods" ON payout_methods
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payout_method_id UUID NOT NULL REFERENCES payout_methods(id) ON DELETE RESTRICT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  reference_id VARCHAR(255),
  failure_reason TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_requested_at ON payouts(requested_at DESC);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own payouts" ON payouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own payouts" ON payouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Create user_earnings table
CREATE TABLE IF NOT EXISTS user_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('streaming', 'beat_sales', 'sync_opportunities', 'royalties')),
  source_id UUID,
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

CREATE INDEX IF NOT EXISTS idx_user_earnings_user_id ON user_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_earnings_status ON user_earnings(status);
CREATE INDEX IF NOT EXISTS idx_user_earnings_source ON user_earnings(source_type, source_id);

ALTER TABLE user_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own earnings" ON user_earnings
  FOR SELECT USING (auth.uid() = user_id);

-- 4. Trigger to ensure single default payout method
CREATE OR REPLACE FUNCTION ensure_single_default_payout_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE payout_methods 
    SET is_default = FALSE 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_payout_method
  BEFORE INSERT OR UPDATE ON payout_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payout_method();
      `)
    } else {
      console.log('✅ Can access payout_methods table successfully')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the setup
createPayoutTables()
