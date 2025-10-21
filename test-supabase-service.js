// Test Supabase service and authentication
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseService() {
  console.log('🔍 Testing Supabase Service...');
  console.log('==========================================');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Environment Variables:');
  console.log('- SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('- ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  console.log('- SERVICE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  console.log('');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing required environment variables');
    return;
  }
  
  try {
    // Test 1: Basic connection with anon key
    console.log('Test 1: Basic Connection');
    console.log('------------------------');
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client created successfully');
    
    // Test 2: Test releases table access (without auth)
    console.log('\\nTest 2: Table Access (Public)');
    console.log('------------------------------');
    const { data: publicTest, error: publicError } = await supabaseClient
      .from('releases')
      .select('count(*)')
      .limit(1);
    
    if (publicError) {
      console.log('❌ Public table access failed:', publicError.message);
      if (publicError.message.includes('JWT')) {
        console.log('🔍 This suggests RLS (Row Level Security) is blocking access without auth');
      }
    } else {
      console.log('✅ Public table access successful');
    }
    
    // Test 3: Test with service role (admin access)
    if (supabaseServiceKey) {
      console.log('\\nTest 3: Service Role Access');
      console.log('----------------------------');
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: adminTest, error: adminError } = await supabaseAdmin
        .from('releases')
        .select('count(*)')
        .limit(1);
      
      if (adminError) {
        console.log('❌ Admin access failed:', adminError.message);
      } else {
        console.log('✅ Admin access successful');
        console.log('📊 Found releases in database');
      }
    }
    
    // Test 4: Test auth endpoint
    console.log('\\nTest 4: Auth Service');
    console.log('--------------------');
    const { data: authData, error: authError } = await supabaseClient.auth.getSession();
    
    if (authError) {
      console.log('❌ Auth service error:', authError.message);
    } else {
      console.log('✅ Auth service accessible');
      console.log('📝 Current session:', authData.session ? 'Active' : 'None');
    }
    
    // Summary
    console.log('\\n==========================================');
    console.log('DIAGNOSIS:');
    
    if (publicError && publicError.message.includes('JWT')) {
      console.log('🎯 ISSUE FOUND: Row Level Security is blocking API access');
      console.log('');
      console.log('💡 SOLUTION: The 401 errors are happening because:');
      console.log('   1. User needs to be properly signed in');
      console.log('   2. Session cookies need to be valid');
      console.log('   3. RLS policies require authenticated users');
      console.log('');
      console.log('🔧 TO FIX:');
      console.log('   - Make sure user is signed in on the frontend');
      console.log('   - Clear browser cookies and sign in again');
      console.log('   - Check that auth cookies are being sent with API requests');
    } else {
      console.log('✅ Service appears to be working correctly');
      console.log('🔍 The issue might be with session management on the frontend');
    }
    
  } catch (error) {
    console.log('❌ Service test failed:', error.message);
  }
}

testSupabaseService();
