#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Original config from .env.local
const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const currentKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Diagnosing Supabase authentication issue...\n');
console.log(`Current Supabase URL: ${currentUrl}`);
console.log(`Current Supabase Anon Key: ${currentKey ? currentKey.substring(0, 10) + '...' : 'Missing'}\n`);

// Test DNS resolution
try {
  console.log('Testing DNS resolution for Supabase URL...');
  const result = execSync(`ping -c 1 ${new URL(currentUrl).hostname}`).toString();
  console.log('✅ DNS resolution successful!');
} catch (error) {
  console.log('❌ DNS resolution failed - Supabase project may have been deleted or renamed');
  console.log('   Internet connection appears to be working since you can run this script\n');
  
  console.log('🔧 Let\'s fix this issue:');
  console.log('1. Login to your Supabase dashboard at https://app.supabase.com');
  console.log('2. Find your active project (or create a new one if needed)');
  console.log('3. Go to Project Settings > API to get your URL and anon key\n');
  
  rl.question('Would you like to update your Supabase configuration now? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      rl.question('Enter your new Supabase URL: ', (newUrl) => {
        rl.question('Enter your new Supabase anon key: ', (newKey) => {
          try {
            // Read the current .env.local file
            const envPath = '.env.local';
            let envContent = fs.readFileSync(envPath, 'utf8');
            
            // Replace the URL and key
            envContent = envContent.replace(
              /NEXT_PUBLIC_SUPABASE_URL=.*/g, 
              `NEXT_PUBLIC_SUPABASE_URL=${newUrl}`
            );
            
            envContent = envContent.replace(
              /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/g, 
              `NEXT_PUBLIC_SUPABASE_ANON_KEY=${newKey}`
            );
            
            // Write the updated content back
            fs.writeFileSync(envPath, envContent);
            
            console.log('\n✅ Supabase configuration updated successfully!');
            console.log('👉 Now restart your development server with: npm run dev');
            
            // Create a test script to verify the connection
            const testScript = `
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Creating Supabase client with updated config:');
console.log('URL:', url);
console.log('ANON_KEY:', key ? key.substring(0, 5) + '...' : 'missing');

try {
  const supabase = createClient(url, key);
  console.log('Supabase client created successfully');
  
  // Test the connection
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('Session error:', error);
    } else {
      console.log('✅ Connection successful!');
      console.log('Session check result:', data);
    }
    process.exit(0);
  });
} catch (error) {
  console.error('Error creating Supabase client:', error);
  process.exit(1);
}
            `;
            
            fs.writeFileSync('test-supabase-connection.js', testScript);
            console.log('\n📝 Created test script: test-supabase-connection.js');
            console.log('👉 Run it with: node test-supabase-connection.js');
            
          } catch (error) {
            console.error('❌ Error updating configuration:', error.message);
          }
          rl.close();
        });
      });
    } else {
      console.log('\nNo changes made. You can update your .env.local file manually later.');
      rl.close();
    }
  });
}
