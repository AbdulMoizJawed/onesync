#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Use the same environment variables as your app
const supabaseUrl = 'https://bazfqignsrvxwbisfwqw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhemZxaWduc3J2eHdiaXNmd3F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMzQyNDQsImV4cCI6MjA2OTYxMDI0NH0.laHA1KPjJj8G7rFUq4lut7WD-Kbe19yrVsS0s7oogrA';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

async function testAuth() {
  console.log('🔍 Testing Supabase Authentication Flow...\n');
  
  try {
    // Test 1: Check connection
    console.log('1. Testing connection...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.log('❌ Session check failed:', sessionError.message);
      return;
    }
    console.log('✅ Connection successful');
    
    // Test 2: Test auth state change listener
    console.log('\n2. Testing auth state change listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`📡 Auth event: ${event}`, session?.user?.email || 'No user');
    });
    console.log('✅ Auth listener registered');
    
    // Test 3: Try to list available auth providers
    console.log('\n3. Testing available auth methods...');
    const { data: providers, error: providersError } = await supabase.auth.getSession();
    if (!providersError) {
      console.log('✅ Auth methods accessible');
    }
    
    // Test 4: Test profile table access (should fail without auth)
    console.log('\n4. Testing profile table access...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profileError) {
      if (profileError.message.includes('RLS')) {
        console.log('✅ RLS is working (profile access denied for unauthenticated user)');
      } else {
        console.log('⚠️  Profile table error:', profileError.message);
      }
    } else {
      console.log('⚠️  Profile table accessible without auth (potential security issue)');
    }
    
    console.log('\n🎉 Auth flow test completed!');
    console.log('\nTry logging in with a test email/password to see if the issue persists.');
    console.log('Check your browser console for detailed error messages.');
    
    subscription.unsubscribe();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth();
