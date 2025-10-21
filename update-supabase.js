#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔄 Supabase Configuration Update Tool');
console.log('====================================');
console.log('This tool will help you update your Supabase project credentials.');

// Current configuration
const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const currentKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log(`\nCurrent Supabase URL: ${currentUrl || 'Not set'}`);
console.log(`Current Supabase Key: ${currentKey ? currentKey.substring(0, 5) + '...' : 'Not set'}\n`);

console.log('To fix your Supabase connection:');
console.log('1. Go to https://app.supabase.com and login to your account');
console.log('2. Create a new project or select your existing project');
console.log('3. Get your Project URL and anon/public key from Project Settings > API\n');

rl.question('Do you have your Supabase project URL and key ready? (y/n): ', (answer) => {
  if (answer.toLowerCase() !== 'y') {
    console.log('\nPlease get your Supabase credentials first, then run this script again.');
    rl.close();
    return;
  }

  rl.question('\nEnter your Supabase project URL: ', (newUrl) => {
    if (!newUrl || !newUrl.includes('supabase.co')) {
      console.log('❌ Invalid URL. It should include "supabase.co"');
      rl.close();
      return;
    }

    rl.question('\nEnter your Supabase anon/public key: ', (newKey) => {
      if (!newKey || newKey.length < 20) {
        console.log('❌ Invalid key. The anon key should be a long string');
        rl.close();
        return;
      }

      try {
        // Backup the current .env.local
        if (fs.existsSync('.env.local')) {
          fs.copyFileSync('.env.local', '.env.local.backup');
          console.log('\n✅ Created backup of current .env.local as .env.local.backup');
        }

        // Read the current .env.local file
        let envContent = '';
        try {
          envContent = fs.readFileSync('.env.local', 'utf8');
        } catch (error) {
          console.log('⚠️ No existing .env.local found, creating a new one');
          envContent = '';
        }

        // Update or add the Supabase configuration
        if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL=')) {
          envContent = envContent.replace(
            /NEXT_PUBLIC_SUPABASE_URL=.*/g,
            `NEXT_PUBLIC_SUPABASE_URL=${newUrl}`
          );
        } else {
          envContent += `\nNEXT_PUBLIC_SUPABASE_URL=${newUrl}`;
        }

        if (envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
          envContent = envContent.replace(
            /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/g,
            `NEXT_PUBLIC_SUPABASE_ANON_KEY=${newKey}`
          );
        } else {
          envContent += `\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${newKey}`;
        }

        // Write the updated content back
        fs.writeFileSync('.env.local', envContent);
        console.log('✅ Supabase configuration updated successfully!');

        // Provide next steps
        console.log('\n📋 Next steps:');
        console.log('1. Make sure your Supabase project has the same database schema');
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
