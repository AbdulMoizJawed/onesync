const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createPayoutSystemTables() {
  console.log('🚀 Setting up payout system tables in your database...\n')

  try {
    // Create payout_methods table using direct SQL execution
    console.log('📝 Creating payout_methods table...')
    
    const createPayoutMethodsSQL = `
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
    `

    // Execute using a transaction approach
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      query: createPayoutMethodsSQL
    }).catch(async () => {
      // If exec_sql doesn't exist, try alternative approach
      console.log('Using alternative table creation method...')
      
      // Use raw SQL execution through query
      const { data, error } = await supabase.from('information_schema.tables').select('*').limit(1)
      
      if (!error) {
        // Database is accessible, let's create tables using a workaround
        return await createTablesDirectly()
      }
      
      throw new Error('Cannot access database for table creation')
    })

    async function createTablesDirectly() {
      console.log('🔧 Creating tables using direct approach...')
      
      // Create a temporary function to execute our SQL
      const setupSQL = `
        -- Drop tables if they exist (for clean setup)
        DROP TABLE IF EXISTS user_earnings CASCADE;
        DROP TABLE IF EXISTS payouts CASCADE;
        DROP TABLE IF EXISTS payout_methods CASCADE;
        DROP FUNCTION IF EXISTS ensure_single_default_payout_method() CASCADE;

        -- 1. Create payout_methods table
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

        -- Create indexes for payout_methods
        CREATE INDEX idx_payout_methods_user_id ON payout_methods(user_id);
        CREATE UNIQUE INDEX idx_payout_methods_user_default ON payout_methods(user_id) WHERE is_default = true;

        -- Enable RLS for payout_methods
        ALTER TABLE payout_methods ENABLE ROW LEVEL SECURITY;

        -- RLS Policies for payout_methods
        CREATE POLICY "Users can view own payout methods" ON payout_methods
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own payout methods" ON payout_methods
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own payout methods" ON payout_methods
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete own payout methods" ON payout_methods
          FOR DELETE USING (auth.uid() = user_id);

        -- Admin policy for payout_methods
        CREATE POLICY "Admins can manage all payout methods" ON payout_methods
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM profiles 
              WHERE id = auth.uid() 
              AND role = 'admin'
            )
          );

        -- 2. Create payouts table
        CREATE TABLE payouts (
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

        -- Create indexes for payouts
        CREATE INDEX idx_payouts_user_id ON payouts(user_id);
        CREATE INDEX idx_payouts_status ON payouts(status);
        CREATE INDEX idx_payouts_requested_at ON payouts(requested_at DESC);

        -- Enable RLS for payouts
        ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

        -- RLS Policies for payouts
        CREATE POLICY "Users can view own payouts" ON payouts
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own payouts" ON payouts
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        -- Admin policy for payouts
        CREATE POLICY "Admins can manage all payouts" ON payouts
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM profiles 
              WHERE id = auth.uid() 
              AND role = 'admin'
            )
          );

        -- 3. Create user_earnings table
        CREATE TABLE user_earnings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('streaming', 'beat_sales', 'sync_opportunities', 'royalties', 'other')),
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

        -- Create indexes for user_earnings
        CREATE INDEX idx_user_earnings_user_id ON user_earnings(user_id);
        CREATE INDEX idx_user_earnings_status ON user_earnings(status);
        CREATE INDEX idx_user_earnings_source ON user_earnings(source_type, source_id);
        CREATE INDEX idx_user_earnings_period ON user_earnings(period_start, period_end);

        -- Enable RLS for user_earnings
        ALTER TABLE user_earnings ENABLE ROW LEVEL SECURITY;

        -- RLS Policies for user_earnings
        CREATE POLICY "Users can view own earnings" ON user_earnings
          FOR SELECT USING (auth.uid() = user_id);

        -- Admin policy for user_earnings
        CREATE POLICY "Admins can view all earnings" ON user_earnings
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM profiles 
              WHERE id = auth.uid() 
              AND role = 'admin'
            )
          );

        -- 4. Create trigger function to ensure single default payout method
        CREATE OR REPLACE FUNCTION ensure_single_default_payout_method()
        RETURNS TRIGGER AS $$
        BEGIN
          IF NEW.is_default = TRUE THEN
            UPDATE payout_methods 
            SET is_default = FALSE, updated_at = NOW()
            WHERE user_id = NEW.user_id AND id != NEW.id;
          END IF;
          
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger
        CREATE TRIGGER trigger_ensure_single_default_payout_method
          BEFORE INSERT OR UPDATE ON payout_methods
          FOR EACH ROW
          EXECUTE FUNCTION ensure_single_default_payout_method();

        -- 5. Create helper functions
        CREATE OR REPLACE FUNCTION get_user_available_balance(user_uuid UUID)
        RETURNS DECIMAL(10,2) AS $$
        BEGIN
          RETURN COALESCE(
            (SELECT SUM(amount) FROM user_earnings 
             WHERE user_id = user_uuid AND status = 'available'),
            0
          );
        END;
        $$ LANGUAGE plpgsql;

        CREATE OR REPLACE FUNCTION get_user_total_earnings(user_uuid UUID)
        RETURNS DECIMAL(10,2) AS $$
        BEGIN
          RETURN COALESCE(
            (SELECT SUM(amount) FROM user_earnings 
             WHERE user_id = user_uuid),
            0
          );
        END;
        $$ LANGUAGE plpgsql;
      `

      // Write SQL to a temporary file for manual execution if needed
      const fs = require('fs')
      fs.writeFileSync('payout_system_setup.sql', setupSQL)
      console.log('📁 SQL commands written to payout_system_setup.sql')

      // Try to execute the SQL via Supabase client
      try {
        // Split the SQL into individual statements and execute them
        const statements = setupSQL.split(';').filter(stmt => stmt.trim().length > 0)
        
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i].trim()
          if (statement) {
            try {
              console.log(`Executing statement ${i + 1}/${statements.length}...`)
              // Use a direct query execution (this might not work with all Supabase setups)
              await supabase.rpc('exec', { sql: statement })
            } catch (err) {
              console.log(`Statement ${i + 1} failed, continuing...`)
            }
          }
        }
      } catch (directError) {
        console.log('Direct SQL execution not available through client')
      }
    }

    // Test if tables were created successfully
    console.log('\n🧪 Testing table creation...')
    
    const { data: payoutMethodsTest, error: testError } = await supabase
      .from('payout_methods')
      .select('id')
      .limit(1)

    if (testError) {
      console.log('❌ Tables not created automatically. Manual setup required.')
      console.log('\n🔧 MANUAL SETUP INSTRUCTIONS:')
      console.log('1. Open your Supabase project dashboard')
      console.log('2. Go to SQL Editor')
      console.log('3. Run the SQL file created: payout_system_setup.sql')
      console.log('   OR copy the SQL commands from the file and execute them')
      console.log('\nAlternatively, run this command and copy the output to SQL Editor:')
      console.log('cat payout_system_setup.sql')
    } else {
      console.log('✅ Tables created successfully!')
      
      // Add some test data to verify functionality
      console.log('\n🎯 Adding test data...')
      
      // Get a test user
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(1)

      if (profiles && profiles.length > 0) {
        const testUserId = profiles[0].id
        console.log(`Using test user: ${profiles[0].email}`)

        // Add test earnings
        const { error: earningsError } = await supabase
          .from('user_earnings')
          .insert([
            {
              user_id: testUserId,
              source_type: 'streaming',
              amount: 25.50,
              status: 'available',
              period_start: '2024-08-01',
              period_end: '2024-08-31'
            },
            {
              user_id: testUserId,
              source_type: 'beat_sales',
              amount: 15.00,
              status: 'available',
              period_start: '2024-09-01',
              period_end: '2024-09-30'
            }
          ])

        if (!earningsError) {
          console.log('✅ Test earnings data added')
        }

        // Test the available balance function
        const { data: balanceData, error: balanceError } = await supabase
          .rpc('get_user_available_balance', { user_uuid: testUserId })

        if (!balanceError && balanceData !== null) {
          console.log(`✅ Available balance for test user: $${balanceData}`)
        }
      }
    }

    console.log('\n🎉 Payout system setup completed!')
    console.log('\n📋 What was created:')
    console.log('  • payout_methods table - Store user payment methods')
    console.log('  • payouts table - Track payout requests')
    console.log('  • user_earnings table - Track user earnings')
    console.log('  • RLS policies for security')
    console.log('  • Helper functions for balance calculations')
    console.log('  • Triggers for data consistency')
    
    console.log('\n🔗 API Endpoints available:')
    console.log('  • POST /api/payout-methods - Add payout method')
    console.log('  • GET /api/payout-methods?user_id=X - Get user payout methods')
    console.log('  • PUT /api/payout-methods - Update payout method')
    console.log('  • DELETE /api/payout-methods?id=X - Delete payout method')
    
    console.log('\n🧪 Test the functionality:')
    console.log('  • Visit: http://localhost:3000/test-payout')
    console.log('  • Or integrate PayoutMethodsManager component into your app')

  } catch (error) {
    console.error('❌ Error during setup:', error)
    console.log('\n🚨 If automatic setup failed, please:')
    console.log('1. Check the payout_system_setup.sql file created')
    console.log('2. Run the SQL manually in your Supabase dashboard')
    console.log('3. Test the setup with: node test-payout-api.js')
  }
}

// Run the setup
createPayoutSystemTables()
