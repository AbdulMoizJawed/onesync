const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPaymentMethodsSetup() {
    console.log('🧪 Testing Payment Methods Setup...\n');
    
    try {
        // Test 1: Check if payment_methods table exists
        console.log('1. Checking payment_methods table...');
        const { data: paymentMethods, error: pmError } = await supabase
            .from('payment_methods')
            .select('*')
            .limit(1);
            
        if (pmError) {
            if (pmError.code === '42P01') {
                console.log('❌ Payment methods table does not exist');
                console.log('   Please run the SQL script in Supabase dashboard first');
                return;
            } else {
                console.error('❌ Error accessing payment_methods table:', pmError);
                return;
            }
        }
        
        console.log('✅ Payment methods table exists');
        
        // Test 2: Check if payout_requests table exists
        console.log('\n2. Checking payout_requests table...');
        const { data: payoutRequests, error: prError } = await supabase
            .from('payout_requests')
            .select('*')
            .limit(1);
            
        if (prError) {
            if (prError.code === '42P01') {
                console.log('❌ Payout requests table does not exist');
                console.log('   Please run the payout requests SQL script in Supabase dashboard');
            } else {
                console.error('❌ Error accessing payout_requests table:', prError);
            }
        } else {
            console.log('✅ Payout requests table exists');
        }
        
        // Test 3: Check if view exists
        console.log('\n3. Checking payout_requests_with_payment_details view...');
        const { data: viewData, error: viewError } = await supabase
            .from('payout_requests_with_payment_details')
            .select('*')
            .limit(1);
            
        if (viewError) {
            console.log('❌ Payout requests view does not exist or has issues:', viewError.message);
        } else {
            console.log('✅ Payout requests view exists and is accessible');
        }
        
        // Test 4: Get current user count for reference
        console.log('\n4. Checking users for reference...');
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .limit(3);
            
        if (usersError) {
            console.log('❌ Error accessing users:', usersError);
        } else {
            console.log(`✅ Found ${users?.length || 0} users in profiles table`);
            if (users && users.length > 0) {
                console.log('   Sample users:');
                users.forEach(user => {
                    console.log(`   - ${user.full_name || 'No name'} (${user.email || 'No email'})`);
                });
            }
        }
        
        console.log('\n🎉 Setup Test Complete!');
        console.log('\n📋 Next Steps:');
        console.log('1. If tables don\'t exist, run the SQL scripts in Supabase dashboard');
        console.log('2. Test the API endpoints: /api/payment-methods and /api/payout-requests');
        console.log('3. Integrate the PaymentMethods component into your app');
        console.log('4. Customize the payout logic based on your earnings system');
        
    } catch (error) {
        console.error('Unexpected error during testing:', error);
    }
}

async function createSamplePaymentMethod() {
    console.log('\n🔧 Creating sample payment method (if possible)...');
    
    try {
        // Get first user
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);
            
        if (usersError || !users || users.length === 0) {
            console.log('❌ No users found to create sample payment method');
            return;
        }
        
        const userId = users[0].id;
        
        // Create sample PayPal payment method
        const { data: paymentMethod, error } = await supabase
            .from('payment_methods')
            .insert([{
                user_id: userId,
                method_type: 'paypal',
                paypal_email: 'sample@example.com',
                is_default: true,
                currency: 'USD',
                notes: 'Sample payment method created by test script'
            }])
            .select()
            .single();
            
        if (error) {
            console.log('❌ Could not create sample payment method:', error.message);
        } else {
            console.log('✅ Sample payment method created:', paymentMethod.id);
        }
        
    } catch (error) {
        console.error('Error creating sample payment method:', error);
    }
}

if (require.main === module) {
    testPaymentMethodsSetup().then(() => {
        // Only create sample if tables exist
        createSamplePaymentMethod();
    });
}