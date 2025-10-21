#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const dns = require('dns');
const { URL } = require('url');

console.log('🔍 Supabase Project Status Check');
console.log('===============================');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase configuration exists
if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase configuration missing in .env.local');
  console.log('Please run ./update-supabase.js to set up your Supabase project credentials.');
  process.exit(1);
}

console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Supabase Key: ${supabaseKey ? supabaseKey.substring(0, 5) + '...' : 'Missing'}\n`);

// Check DNS resolution for Supabase host
const hostname = new URL(supabaseUrl).hostname;
console.log(`Checking DNS resolution for ${hostname}...`);

dns.lookup(hostname, (err) => {
  if (err) {
    console.log(`❌ DNS lookup failed: ${err.message}`);
    console.log('\nYour Supabase project appears to be inaccessible. This might be because:');
    console.log('1. The project has been deleted from your Supabase account');
    console.log('2. The project has been renamed');
    console.log('3. There is a network connectivity issue');
    console.log('\nTo fix this issue:');
    console.log('1. Go to https://app.supabase.com and check your projects');
    console.log('2. Create a new project if needed');
    console.log('3. Run ./update-supabase.js to update your credentials');
    process.exit(1);
  }

  console.log('✅ DNS resolution successful!');
  
  // Try to connect to the Supabase API
  console.log('\nTesting connection to Supabase API...');
  
  const options = {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  };
  
  const req = https.request(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`, options, (res) => {
    console.log(`API response status code: ${res.statusCode}`);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Supabase API connection successful!');
      console.log('\nYour Supabase project is working correctly.');
    } else {
      console.log('❌ Supabase API connection failed.');
      console.log('\nYour Supabase project exists but returned an error response.');
      console.log('This might be due to authentication issues or project configuration.');
      console.log('\nTo fix this issue:');
      console.log('1. Verify your anon/public key in the Supabase dashboard');
      console.log('2. Run ./update-supabase.js to update your credentials');
    }
  });
  
  req.on('error', (error) => {
    console.log(`❌ Connection error: ${error.message}`);
    console.log('\nUnable to connect to your Supabase project.');
    console.log('This might be due to network issues or project configuration.');
    console.log('\nTo fix this issue:');
    console.log('1. Check your internet connection');
    console.log('2. Verify your project settings in the Supabase dashboard');
    console.log('3. Run ./update-supabase.js to update your credentials');
  });
  
  req.end();
});
