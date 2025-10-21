const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function createStripeTables() {
  console.log('🔧 Creating Stripe tables directly...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  // Create tables one by one
  const tables = [
    {
      name: 'stripe_accounts',
      sql: `
        CREATE TABLE IF NOT EXISTS public.stripe_accounts (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          stripe_account_id TEXT UNIQUE NOT NULL,
          stripe_user_id TEXT,
          business_type TEXT,
          business_name TEXT,
          country TEXT DEFAULT 'US',
          default_currency TEXT DEFAULT 'usd',
          details_submitted BOOLEAN DEFAULT FALSE,
          charges_enabled BOOLEAN DEFAULT FALSE,
          payouts_enabled BOOLEAN DEFAULT FALSE,
          requirements_due_date TIMESTAMP,
          requirements_currently_due TEXT[],
          requirements_eventually_due TEXT[],
          capabilities JSONB DEFAULT '{}',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_stripe_accounts_user_id ON public.stripe_accounts(user_id);
        CREATE INDEX IF NOT EXISTS idx_stripe_accounts_stripe_id ON public.stripe_accounts(stripe_account_id);
        
        ALTER TABLE public.stripe_accounts ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view their own Stripe accounts" ON public.stripe_accounts;
        CREATE POLICY "Users can view their own Stripe accounts" 
          ON public.stripe_accounts FOR SELECT 
          USING (auth.uid() = user_id);
          
        DROP POLICY IF EXISTS "Users can insert their own Stripe accounts" ON public.stripe_accounts;
        CREATE POLICY "Users can insert their own Stripe accounts" 
          ON public.stripe_accounts FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
          
        DROP POLICY IF EXISTS "Users can update their own Stripe accounts" ON public.stripe_accounts;
        CREATE POLICY "Users can update their own Stripe accounts" 
          ON public.stripe_accounts FOR UPDATE 
          USING (auth.uid() = user_id);
      `
    },
    {
      name: 'royalty_payouts',
      sql: `
        CREATE TABLE IF NOT EXISTS public.royalty_payouts (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          release_id UUID,
          stripe_payout_id TEXT UNIQUE,
          stripe_transfer_id TEXT,
          amount DECIMAL(10,2) NOT NULL,
          currency TEXT DEFAULT 'usd',
          description TEXT,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'paid', 'failed', 'canceled')),
          failure_code TEXT,
          failure_message TEXT,
          arrival_date TIMESTAMP,
          payout_method TEXT DEFAULT 'standard',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_royalty_payouts_user_id ON public.royalty_payouts(user_id);
        CREATE INDEX IF NOT EXISTS idx_royalty_payouts_status ON public.royalty_payouts(status);
        
        ALTER TABLE public.royalty_payouts ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view their own royalty payouts" ON public.royalty_payouts;
        CREATE POLICY "Users can view their own royalty payouts" 
          ON public.royalty_payouts FOR SELECT 
          USING (auth.uid() = user_id);
          
        DROP POLICY IF EXISTS "Users can insert their own royalty payouts" ON public.royalty_payouts;
        CREATE POLICY "Users can insert their own royalty payouts" 
          ON public.royalty_payouts FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
          
        DROP POLICY IF EXISTS "Users can update their own royalty payouts" ON public.royalty_payouts;
        CREATE POLICY "Users can update their own royalty payouts" 
          ON public.royalty_payouts FOR UPDATE 
          USING (auth.uid() = user_id);
      `
    },
    {
      name: 'stripe_webhook_events',
      sql: `
        CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
          id SERIAL PRIMARY KEY,
          stripe_event_id TEXT UNIQUE NOT NULL,
          event_type TEXT NOT NULL,
          account_id TEXT,
          processed BOOLEAN DEFAULT FALSE,
          data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Service role can manage webhook events" ON public.stripe_webhook_events;
        CREATE POLICY "Service role can manage webhook events" 
          ON public.stripe_webhook_events FOR ALL 
          USING (true);
      `
    },
    {
      name: 'revenue_splits',
      sql: `
        CREATE TABLE IF NOT EXISTS public.revenue_splits (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          release_id UUID,
          platform_name TEXT NOT NULL,
          total_revenue DECIMAL(10,2) DEFAULT 0,
          earned_amount DECIMAL(10,2) DEFAULT 0,
          pending_amount DECIMAL(10,2) DEFAULT 0,
          paid_amount DECIMAL(10,2) DEFAULT 0,
          split_percentage DECIMAL(5,2) DEFAULT 70.00,
          stripe_transfer_id TEXT,
          stripe_payout_id TEXT,
          last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_revenue_splits_user_id ON public.revenue_splits(user_id);
        
        ALTER TABLE public.revenue_splits ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view their own revenue splits" ON public.revenue_splits;
        CREATE POLICY "Users can view their own revenue splits" 
          ON public.revenue_splits FOR SELECT 
          USING (auth.uid() = user_id);
          
        DROP POLICY IF EXISTS "Users can insert their own revenue splits" ON public.revenue_splits;
        CREATE POLICY "Users can insert their own revenue splits" 
          ON public.revenue_splits FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
          
        DROP POLICY IF EXISTS "Users can update their own revenue splits" ON public.revenue_splits;
        CREATE POLICY "Users can update their own revenue splits" 
          ON public.revenue_splits FOR UPDATE 
          USING (auth.uid() = user_id);
      `
    }
  ]
  
  for (const table of tables) {
    try {
      console.log(`📋 Creating table: ${table.name}...`)
      
      // Try to create table using raw SQL
      const { error } = await supabase.rpc('exec_sql', { sql: table.sql })
      
      if (error) {
        console.log(`❌ Failed to create ${table.name} with exec_sql:`, error.message)
        
        // Try alternative method - create minimal table first
        const basicTableSql = table.sql.split('CREATE TABLE')[1].split(';')[0]
        const createCommand = 'CREATE TABLE' + basicTableSql + ';'
        
        console.log(`🔄 Trying basic creation for ${table.name}...`)
        const { error: basicError } = await supabase.rpc('exec_sql', { sql: createCommand })
        
        if (basicError) {
          console.log(`❌ Basic creation also failed for ${table.name}:`, basicError.message)
        } else {
          console.log(`✅ Basic table ${table.name} created successfully`)
        }
      } else {
        console.log(`✅ Table ${table.name} created successfully`)
      }
      
    } catch (err) {
      console.log(`❌ Error creating ${table.name}:`, err.message)
    }
  }
  
  // Test table access
  console.log('\n🔍 Testing table access...')
  
  const tableNames = ['stripe_accounts', 'royalty_payouts', 'stripe_webhook_events', 'revenue_splits']
  
  for (const tableName of tableNames) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ Table ${tableName}: ${error.message}`)
      } else {
        console.log(`✅ Table ${tableName}: Accessible`)
      }
    } catch (err) {
      console.log(`❌ Table ${tableName}: ${err.message}`)
    }
  }
  
  console.log('\n🎉 Stripe database setup complete!')
}

createStripeTables()
