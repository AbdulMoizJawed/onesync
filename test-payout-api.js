const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testPayoutAPI() {
  try {
    console.log('🧪 Testing Payout Methods API...\n')

    // First check if tables exist
    console.log('1️⃣ Checking if payout_methods table exists...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('payout_methods')
      .select('id')
      .limit(1)

    if (tableError) {
      console.log('❌ payout_methods table does not exist:', tableError.message)
      console.log('\n🚨 SETUP REQUIRED:')
      console.log('You need to run the SQL from the previous output in your Supabase SQL Editor first!')
      console.log('\nSteps:')
      console.log('1. Go to your Supabase project dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Copy and paste the SQL commands provided above')
      console.log('4. Execute the SQL to create the payout tables')
      console.log('5. Run this test script again')
      return
    }

    console.log('✅ payout_methods table exists!')

    // Get a test user ID from your users table
    console.log('\n2️⃣ Getting test user...')
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1)

    if (usersError || !users || users.length === 0) {
      console.log('❌ No test user found:', usersError?.message)
      return
    }

    const testUserId = users[0].id
    console.log(`✅ Using test user: ${users[0].email} (${testUserId})`)

    // Test adding a PayPal payout method
    console.log('\n3️⃣ Testing PayPal payout method creation...')
    const { data: paypalMethod, error: paypalError } = await supabase
      .from('payout_methods')
      .insert([{
        user_id: testUserId,
        type: 'paypal',
        details: { email: 'test@paypal.com' },
        is_default: true,
        is_active: true
      }])
      .select()
      .single()

    if (paypalError) {
      console.log('❌ Failed to create PayPal method:', paypalError.message)
    } else {
      console.log('✅ PayPal payout method created:', paypalMethod.id)
    }

    // Test adding a bank transfer method
    console.log('\n4️⃣ Testing Bank Transfer payout method creation...')
    const { data: bankMethod, error: bankError } = await supabase
      .from('payout_methods')
      .insert([{
        user_id: testUserId,
        type: 'bank_transfer',
        details: {
          account_holder_name: 'Test User',
          account_number: '1234567890',
          routing_number: '021000021',
          bank_name: 'Test Bank'
        },
        is_default: false,
        is_active: true
      }])
      .select()
      .single()

    if (bankError) {
      console.log('❌ Failed to create Bank Transfer method:', bankError.message)
    } else {
      console.log('✅ Bank Transfer payout method created:', bankMethod.id)
    }

    // Test fetching user's payout methods
    console.log('\n5️⃣ Testing payout methods retrieval...')
    const { data: userMethods, error: fetchError } = await supabase
      .from('payout_methods')
      .select('*')
      .eq('user_id', testUserId)
      .eq('is_active', true)

    if (fetchError) {
      console.log('❌ Failed to fetch payout methods:', fetchError.message)
    } else {
      console.log(`✅ Found ${userMethods.length} payout methods for user:`)
      userMethods.forEach(method => {
        console.log(`   - ${method.type} (${method.is_default ? 'default' : 'secondary'})`)
      })
    }

    // Test the API endpoint directly
    console.log('\n6️⃣ Testing API endpoint...')
    try {
      const response = await fetch(`http://localhost:3000/api/payout-methods?user_id=${testUserId}`)
      const result = await response.json()
      
      if (response.ok) {
        console.log('✅ API endpoint working:', result.data?.length, 'methods returned')
      } else {
        console.log('❌ API endpoint error:', result.error)
      }
    } catch (apiError) {
      console.log('❌ API endpoint test failed:', apiError.message)
      console.log('(This is expected if the development server is not running)')
    }

    // Clean up test data
    console.log('\n7️⃣ Cleaning up test data...')
    if (paypalMethod) {
      await supabase.from('payout_methods').delete().eq('id', paypalMethod.id)
    }
    if (bankMethod) {
      await supabase.from('payout_methods').delete().eq('id', bankMethod.id)
    }
    console.log('✅ Test data cleaned up')

    console.log('\n🎉 Payout Methods API test completed!')
    console.log('\n📝 Next steps:')
    console.log('1. The payout system tables are ready')
    console.log('2. You can now add payout methods through the API')
    console.log('3. Use the /api/payout-methods endpoint to:')
    console.log('   - POST: Add new payout method')
    console.log('   - GET: Retrieve user payout methods') 
    console.log('   - PUT: Update existing payout method')
    console.log('   - DELETE: Remove payout method')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testPayoutAPI()
