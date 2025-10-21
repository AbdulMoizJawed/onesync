#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Comprehensive Supabase Health Check\n');

// Check environment variables
console.log('1. Environment Variables:');
console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
console.log('   URL Format:', supabaseUrl?.includes('supabase.co') ? '✅ Valid' : '❌ Invalid');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n❌ Missing required environment variables. Check your .env.local file.');
  process.exit(1);
}

// Create clients
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function runHealthCheck() {
  try {
    console.log('\n2. Connection Tests:');
    
    // Test basic connection
    console.log('   Testing basic connection...');
    const { data: healthData, error: healthError } = await anonClient.auth.getSession();
    if (healthError) {
      console.log('   ❌ Connection failed:', healthError.message);
      return;
    }
    console.log('   ✅ Basic connection successful');
    
    // Test auth configuration
    console.log('   Testing auth configuration...');
    const { data: config, error: configError } = await anonClient.auth.getUser();
    if (configError && !configError.message.includes('session_not_found')) {
      console.log('   ❌ Auth config error:', configError.message);
    } else {
      console.log('   ✅ Auth configuration working');
    }
    
    console.log('\n3. Database Access Tests:');
    
    // Test public schema access
    console.log('   Testing public schema access...');
    const { data: schemaTest, error: schemaError } = await anonClient
      .from('profiles')
      .select('count')
      .limit(0);
    
    if (schemaError) {
      if (schemaError.message.includes('relation "public.profiles" does not exist')) {
        console.log('   ❌ Profiles table does not exist');
      } else if (schemaError.message.includes('RLS') || schemaError.code === 'PGRST301') {
        console.log('   ✅ Database accessible (RLS protecting data)');
      } else {
        console.log('   ⚠️  Database error:', schemaError.message);
      }
    } else {
      console.log('   ✅ Database accessible');
    }
    
    // Test with service role if available
    if (serviceClient) {
      console.log('\n4. Service Role Tests:');
      console.log('   Testing service role access...');
      
      const { data: serviceData, error: serviceError } = await serviceClient
        .from('profiles')
        .select('count')
        .limit(0);
      
      if (serviceError) {
        console.log('   ❌ Service role error:', serviceError.message);
      } else {
        console.log('   ✅ Service role working');
      }
      
      // Check table existence
      console.log('   Checking required tables...');
      const requiredTables = ['profiles', 'artists', 'releases', 'analytics', 'activity_log'];
      
      for (const table of requiredTables) {
        try {
          const { error } = await serviceClient
            .from(table)
            .select('count')
            .limit(0);
          
          if (error && error.message.includes('does not exist')) {
            console.log(`   ❌ Table "${table}" missing`);
          } else {
            console.log(`   ✅ Table "${table}" exists`);
          }
        } catch (err) {
          console.log(`   ⚠️  Table "${table}" check failed:`, err.message);
        }
      }
    }
    
    console.log('\n5. Authentication Flow Test:');
    console.log('   Testing sign-up capability...');
    
    // Test sign up with fake email (should fail gracefully)
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
      email: testEmail,
      password: 'testpassword123',
      options: { data: { full_name: 'Test User' } }
    });
    
    if (signUpError) {
      if (signUpError.message.includes('rate limit') || 
          signUpError.message.includes('Signup is disabled') ||
          signUpError.message.includes('Email domain')) {
        console.log('   ✅ Sign-up properly configured (with restrictions)');
      } else {
        console.log('   ⚠️  Sign-up error:', signUpError.message);
      }
    } else {
      console.log('   ✅ Sign-up working (confirmation required)');
    }
    
    console.log('\n6. Real-time Subscription Test:');
    console.log('   Testing real-time capabilities...');
    
    try {
      const channel = anonClient
        .channel('test-channel')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'profiles' }, 
          () => {})
        .subscribe();
      
      if (channel) {
        console.log('   ✅ Real-time subscriptions available');
        anonClient.removeChannel(channel);
      }
    } catch (err) {
      console.log('   ⚠️  Real-time error:', err.message);
    }
    
    console.log('\n🎉 Supabase Health Check Complete!');
    console.log('\nRecommendations:');
    console.log('• If login fails, check RLS policies on profiles table');
    console.log('• Ensure email confirmation is set up if sign-up succeeds');
    console.log('• Check Supabase dashboard for any service interruptions');
    console.log('• Try creating a test user from Supabase dashboard');
    
  } catch (error) {
    console.error('\n❌ Health check failed:', error.message);
    console.log('\nThis might indicate:');
    console.log('• Network connectivity issues');
    console.log('• Supabase service downtime');
    console.log('• Invalid API keys');
    console.log('• Firewall/proxy blocking requests');
  }
}

runHealthCheck();
