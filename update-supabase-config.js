#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🛠️  Supabase Configuration Update Tool');
console.log('--------------------------------------');
console.log('This tool will help you fix your Supabase authentication issue by updating your credentials.\n');

console.log('To fix this, you need to:');
console.log('1. Go to https://app.supabase.com and sign in to your account');
console.log('2. Create a new project or select an existing one');
console.log('3. Get your project URL and anon key from Project Settings > API\n');

rl.question('Have you created a new Supabase project and have the credentials ready? (y/n): ', (answer) => {
  if (answer.toLowerCase() !== 'y') {
    console.log('\n⚠️  Please create a Supabase project first, then run this script again.');
    rl.close();
    return;
  }

  rl.question('\nEnter your Supabase project URL (e.g., https://example.supabase.co): ', (url) => {
    if (!url || !url.includes('supabase.co')) {
      console.log('❌ Invalid URL. It should include "supabase.co"');
      rl.close();
      return;
    }

    rl.question('\nEnter your Supabase anon key: ', (key) => {
      if (!key || key.length < 20) {
        console.log('❌ Invalid key. The anon key should be a long string');
        rl.close();
        return;
      }

      try {
        // Backup the current .env.local
        if (fs.existsSync('.env.local')) {
          fs.copyFileSync('.env.local', '.env.local.backup');
          console.log('✅ Created backup of current .env.local as .env.local.backup');
        }

        // Read the current .env.local file or create a new one
        let envContent = '';
        try {
          envContent = fs.readFileSync('.env.local', 'utf8');
        } catch (error) {
          console.log('⚠️ No existing .env.local found, creating a new one');
        }

        // Update Supabase configuration
        if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL=')) {
          envContent = envContent.replace(
            /NEXT_PUBLIC_SUPABASE_URL=.*/g,
            `NEXT_PUBLIC_SUPABASE_URL=${url}`
          );
        } else {
          envContent += `\nNEXT_PUBLIC_SUPABASE_URL=${url}`;
        }

        if (envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
          envContent = envContent.replace(
            /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/g,
            `NEXT_PUBLIC_SUPABASE_ANON_KEY=${key}`
          );
        } else {
          envContent += `\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${key}`;
        }

        // Write the updated content back
        fs.writeFileSync('.env.local', envContent);
        console.log('\n✅ Supabase configuration updated successfully!');

        // Create a test script
        const testScript = `
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection with:');
console.log('URL:', url);
console.log('ANON_KEY:', key ? key.substring(0, 10) + '...' : 'missing');

try {
  const supabase = createClient(url, key);
  console.log('✅ Supabase client created successfully');
  
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('❌ Session error:', error);
    } else {
      console.log('✅ Connection successful!');
      console.log('Session check result:', data);
    }
    process.exit(0);
  }).catch(err => {
    console.error('❌ Failed to get session:', err);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Error creating Supabase client:', error);
  process.exit(1);
}`;

        fs.writeFileSync('test-supabase-connection.js', testScript);
        console.log('✅ Created test script: test-supabase-connection.js');
        console.log('\n📋 Next steps:');
        console.log('1. Run the test script: node test-supabase-connection.js');
        console.log('2. Restart your development server: npm run dev');
        console.log('3. Try logging in again\n');
        
        rl.close();
      } catch (error) {
        console.error('❌ Error updating configuration:', error.message);
        rl.close();
      }
    });
  });
});
