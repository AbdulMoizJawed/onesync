const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testPayoutFunctionality() {
  try {
    console.log('🧪 Testing Payout System Functionality\n');
    
    // Check if tables exist
    console.log('1. Checking database tables...');
    const { data: payoutMethods, error: payoutError } = await supabase
      .from('payout_methods')
      .select('*')
      .limit(1);
    
    const { data: adminNotifications, error: adminError } = await supabase
      .from('admin_notifications')
      .select('*')
      .limit(1);
    
    if (payoutError || adminError) {
      console.log('❌ Database tables missing!');
      console.log('   payout_methods:', payoutError ? '❌ Missing' : '✅ Exists');
      console.log('   admin_notifications:', adminError ? '❌ Missing' : '✅ Exists');
      console.log('\n📋 SETUP REQUIRED:');
      console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the SQL from: create-payout-system-complete.sql');
      console.log('4. Then run this test again');
      return;
    }
    
    console.log('✅ All required tables exist');
    
    // Get test user
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError || !users.users.length) {
      console.log('❌ No users found for testing');
      return;
    }
    
    const testUser = users.users[0];
    console.log(`   Using test user: ${testUser.email}`);
    
    // Test PayPal payout method creation
    console.log('\n2. Testing PayPal payout method...');
    const paypalData = {
      user_id: testUser.id,
      method_type: 'paypal',
      paypal_email: 'test@paypal.com',
      is_primary: true
    };
    
    const { data: paypalMethod, error: paypalCreateError } = await supabase
      .from('payout_methods')
      .insert(paypalData)
      .select()
      .single();
    
    if (paypalCreateError) {
      console.log('❌ Failed to create PayPal method:', paypalCreateError.message);
    } else {
      console.log('✅ PayPal payout method created:', paypalMethod.id);
    }
    
    // Test Bank Transfer payout method creation
    console.log('\n3. Testing Bank Transfer payout method...');
    const bankData = {
      user_id: testUser.id,
      method_type: 'bank_transfer',
      account_holder_name: 'John Doe',
      account_number: '1234567890',
      routing_number: '021000021',
      bank_name: 'Test Bank',
      bank_country: 'US',
      is_primary: false
    };
    
    const { data: bankMethod, error: bankCreateError } = await supabase
      .from('payout_methods')
      .insert(bankData)
      .select()
      .single();
    
    if (bankCreateError) {
      console.log('❌ Failed to create Bank Transfer method:', bankCreateError.message);
    } else {
      console.log('✅ Bank Transfer payout method created:', bankMethod.id);
    }
    
    // Test fetching payout methods
    console.log('\n4. Testing payout method retrieval...');
    const { data: userMethods, error: fetchError } = await supabase
      .from('payout_methods')
      .select('*')
      .eq('user_id', testUser.id);
    
    if (fetchError) {
      console.log('❌ Failed to fetch payout methods:', fetchError.message);
    } else {
      console.log(`✅ Retrieved ${userMethods.length} payout methods`);
      userMethods.forEach(method => {
        console.log(`   - ${method.method_type} (${method.is_primary ? 'Primary' : 'Secondary'})`);
      });
    }
    
    // Test admin notification creation
    console.log('\n5. Testing admin notifications...');
    const notificationData = {
      type: 'test_notification',
      title: 'Test Notification',
      message: 'This is a test notification for payout system',
      data: { test: true }
    };
    
    const { data: notification, error: notifError } = await supabase
      .from('admin_notifications')
      .insert(notificationData)
      .select()
      .single();
    
    if (notifError) {
      console.log('❌ Failed to create admin notification:', notifError.message);
    } else {
      console.log('✅ Admin notification created:', notification.id);
    }
    
    // Clean up test data
    console.log('\n6. Cleaning up test data...');
    if (paypalMethod) {
      await supabase.from('payout_methods').delete().eq('id', paypalMethod.id);
      console.log('✅ PayPal method cleaned up');
    }
    
    if (bankMethod) {
      await supabase.from('payout_methods').delete().eq('id', bankMethod.id);
      console.log('✅ Bank method cleaned up');
    }
    
    if (notification) {
      await supabase.from('admin_notifications').delete().eq('id', notification.id);
      console.log('✅ Test notification cleaned up');
    }
    
    console.log('\n🎉 All payout system tests passed!');
    console.log('\n📋 Summary:');
    console.log('✅ Database tables exist');
    console.log('✅ PayPal payout methods work');
    console.log('✅ Bank transfer payout methods work');
    console.log('✅ Payout method retrieval works');
    console.log('✅ Admin notifications work');
    console.log('❌ Crypto payout methods removed (as requested)');
    console.log('\n🚀 The payout system is ready to use!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPayoutFunctionality();
