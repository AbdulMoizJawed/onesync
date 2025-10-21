// Create Stripe Database Tables
require('dotenv').config({ path: '.env.local' });

async function createStripeTables() {
  console.log('🔧 Creating Stripe database tables...\n');

  // Use the service role key for admin operations
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // Create stripe_accounts table
    console.log('1. Creating stripe_accounts table...');
    const { error: table1Error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS stripe_accounts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          stripe_account_id TEXT NOT NULL UNIQUE,
          account_type TEXT NOT NULL DEFAULT 'express',
          onboarding_completed BOOLEAN NOT NULL DEFAULT false,
          payouts_enabled BOOLEAN NOT NULL DEFAULT false,
          charges_enabled BOOLEAN NOT NULL DEFAULT false,
          details_submitted BOOLEAN NOT NULL DEFAULT false,
          verification_status TEXT NOT NULL DEFAULT 'pending_submission',
          default_currency TEXT NOT NULL DEFAULT 'usd',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(user_id, stripe_account_id)
        );
      `
    });
    
    if (table1Error) {
      console.log('❌ Error creating stripe_accounts:', table1Error.message);
    } else {
      console.log('✅ stripe_accounts table created');
    }

    // Create royalty_payouts table
    console.log('2. Creating royalty_payouts table...');
    const { error: table2Error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS royalty_payouts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          release_id UUID REFERENCES releases(id) ON DELETE SET NULL,
          amount DECIMAL(10, 2) NOT NULL,
          currency TEXT NOT NULL DEFAULT 'usd',
          status TEXT NOT NULL DEFAULT 'pending',
          stripe_payout_id TEXT,
          failure_reason TEXT,
          payout_date TIMESTAMPTZ,
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    });
    
    if (table2Error) {
      console.log('❌ Error creating royalty_payouts:', table2Error.message);
    } else {
      console.log('✅ royalty_payouts table created');
    }

    // Create stripe_webhook_events table
    console.log('3. Creating stripe_webhook_events table...');
    const { error: table3Error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS stripe_webhook_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          stripe_event_id TEXT NOT NULL UNIQUE,
          event_type TEXT NOT NULL,
          account_id TEXT,
          event_data JSONB NOT NULL,
          processed BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    });
    
    if (table3Error) {
      console.log('❌ Error creating stripe_webhook_events:', table3Error.message);
    } else {
      console.log('✅ stripe_webhook_events table created');
    }

    console.log('\n🎉 Stripe database setup complete!');
    
    // Test the tables
    console.log('\n🔍 Testing table access...');
    const { data: accounts, error: testError } = await supabase
      .from('stripe_accounts')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.log('❌ Table test failed:', testError.message);
    } else {
      console.log('✅ Tables are accessible and ready!');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

createStripeTables();
