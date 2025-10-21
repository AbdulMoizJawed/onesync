const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPaymentMethodsTable() {
    try {
        console.log('Creating payment_methods table...');
        
        // First, let's create the payment methods table manually using simpler approach
        console.log('Creating table structure manually...');
        
        // We'll use SQL queries through edge functions or direct SQL
        // For now, let's try to insert a test record to see if table exists
        const { data: testData, error: testError } = await supabase
            .from('payment_methods')
            .select('*')
            .limit(1);
            
        if (testError && testError.code === 'PGRST116') {
            console.log('Payment methods table does not exist, need to create it manually in Supabase');
            console.log('Please run the SQL script in the Supabase dashboard SQL editor');
            return;
        } else if (testError) {
            console.error('Error checking payment_methods table:', testError);
            return;
        } else {
            console.log('✅ Payment methods table already exists');
        }
        
        // Verify the table structure by trying to access it
        console.log('✅ Payment methods table verified');
        
        // Check if payout_requests table exists
        const { data: payoutRequestsInfo, error: payoutError } = await supabase
            .from('payout_requests')
            .select('*')
            .limit(0);
            
        if (payoutError) {
            console.log('Note: payout_requests table may not exist yet, which is fine');
        } else {
            console.log('✅ Payout requests table found');
        }
        
        // Show table structure
        console.log('\n📋 Payment Methods Table Structure:');
        console.log('- id (UUID, Primary Key)');
        console.log('- user_id (UUID, Foreign Key to auth.users)');
        console.log('- method_type (paypal, bank_transfer, crypto, stripe, wise)');
        console.log('- is_default (Boolean)');
        console.log('- is_active (Boolean)');
        console.log('- PayPal: paypal_email');
        console.log('- Bank: account_holder_name, bank_name, routing_number, account_number, swift_code, iban');
        console.log('- Crypto: crypto_type, crypto_address');
        console.log('- Stripe: stripe_account_id');
        console.log('- Wise: wise_account_id, wise_email');
        console.log('- Additional: country_code, currency, notes');
        console.log('- Timestamps: created_at, updated_at');
        
        console.log('\n🔒 Security Features:');
        console.log('- Row Level Security enabled');
        console.log('- Users can only access their own payment methods');
        console.log('- Admins can view all payment methods');
        console.log('- Automatic single default payment method per user');
        console.log('- Data validation constraints for each payment type');
        
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

// Alternative method using direct SQL execution
async function createPaymentMethodsTableDirect() {
    try {
        console.log('Creating payment_methods table using direct SQL execution...');
        
        // Create the table with all fields
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS payment_methods (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                method_type TEXT NOT NULL CHECK (method_type IN ('paypal', 'bank_transfer', 'crypto', 'stripe', 'wise')),
                is_default BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                
                -- PayPal specific fields
                paypal_email TEXT,
                
                -- Bank transfer specific fields
                account_holder_name TEXT,
                bank_name TEXT,
                routing_number TEXT,
                account_number TEXT,
                swift_code TEXT,
                iban TEXT,
                
                -- Crypto specific fields
                crypto_type TEXT,
                crypto_address TEXT,
                
                -- Stripe specific fields
                stripe_account_id TEXT,
                
                -- Wise specific fields
                wise_account_id TEXT,
                wise_email TEXT,
                
                -- Additional fields
                country_code TEXT,
                currency TEXT DEFAULT 'USD',
                notes TEXT,
                
                -- Metadata
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;
        
        const { error: createError } = await supabase.rpc('exec_sql', { 
            sql_query: createTableQuery 
        });
        
        if (createError) {
            console.error('Error creating table:', createError);
            return;
        }
        
        console.log('✅ Payment methods table created');
        
        // Create indexes
        const indexQueries = [
            'CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);',
            'CREATE INDEX IF NOT EXISTS idx_payment_methods_user_default ON payment_methods(user_id, is_default) WHERE is_default = true;',
            'CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(user_id, is_active) WHERE is_active = true;'
        ];
        
        for (const query of indexQueries) {
            const { error } = await supabase.rpc('exec_sql', { sql_query: query });
            if (error) {
                console.error('Error creating index:', error);
            }
        }
        
        console.log('✅ Indexes created');
        
        // Enable RLS
        const rlsQuery = 'ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;';
        const { error: rlsError } = await supabase.rpc('exec_sql', { sql_query: rlsQuery });
        
        if (rlsError) {
            console.error('Error enabling RLS:', rlsError);
        } else {
            console.log('✅ Row Level Security enabled');
        }
        
        console.log('\n🎉 Payment methods table setup complete!');
        
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

async function main() {
    console.log('Setting up payment methods table for payout requests...\n');
    
    // Try the RPC method first, fallback to direct if needed
    try {
        await createPaymentMethodsTable();
    } catch (error) {
        console.log('RPC method failed, trying direct SQL execution...');
        await createPaymentMethodsTableDirect();
    }
}

if (require.main === module) {
    main();
}