#!/usr/bin/env node

/**
 * Supabase Authentication Fix Script
 * 
 * This script helps fix Supabase authentication issues by:
 * 1. Applying the fallback solution for development
 * 2. Providing options to update Supabase configuration
 * 3. Restarting the development server
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔄 OneSync Supabase Authentication Fix');
console.log('=====================================');
console.log('This script will fix the login "failing to fetch" issue by implementing a fallback solution\n');

console.log('Choose an option:');
console.log('1. Use development fallback (fastest solution, works without a Supabase project)');
console.log('2. Update Supabase configuration (requires a valid Supabase project)');
console.log('3. Exit\n');

rl.question('Enter your choice (1-3): ', (choice) => {
  switch (choice) {
    case '1':
      applyFallbackSolution();
      break;
    case '2':
      updateSupabaseConfig();
      break;
    case '3':
      console.log('Exiting without changes.');
      rl.close();
      break;
    default:
      console.log('Invalid choice. Exiting.');
      rl.close();
  }
});

function applyFallbackSolution() {
  console.log('\n🔧 Applying development fallback solution...');
  
  try {
    // Ensure the fallback file exists
    if (!fs.existsSync('./supabase-fallback.js')) {
      console.error('❌ supabase-fallback.js file not found. Please run the fix script again.');
      rl.close();
      return;
    }
    
    // Execute the fallback script
    require('./supabase-fallback').patchSupabaseClient();
    console.log('✅ Supabase fallback applied successfully!');
    
    rl.question('\nWould you like to restart the development server now? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        restartDevelopmentServer();
      } else {
        console.log('\n📋 To complete the fix, restart your development server with:');
        console.log('npm run dev');
        rl.close();
      }
    });
  } catch (error) {
    console.error('❌ Failed to apply fallback solution:', error.message);
    rl.close();
  }
}

function updateSupabaseConfig() {
  console.log('\n🔧 Updating Supabase configuration...');
  
  // Execute the update script as a child process
  const child = spawn('node', ['update-supabase-config.js'], { 
    stdio: 'inherit',
    shell: true
  });
  
  child.on('exit', (code) => {
    if (code === 0) {
      rl.question('\nWould you like to restart the development server now? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          restartDevelopmentServer();
        } else {
          console.log('\n📋 To complete the fix, restart your development server with:');
          console.log('npm run dev');
          rl.close();
        }
      });
    } else {
      console.error('❌ Failed to update Supabase configuration');
      rl.close();
    }
  });
}

function restartDevelopmentServer() {
  console.log('\n🔄 Stopping any running development servers...');
  
  try {
    // Kill any running development servers
    execSync('pkill -f "npm run dev" || pkill -f "next dev" || true');
    console.log('✅ Killed any running development servers');
    
    // Start the development server
    console.log('\n🚀 Starting development server...');
    console.log('The server will continue running in this terminal window.');
    console.log('Press Ctrl+C to stop the server when you\'re done.\n');
    
    // Give a moment for processes to fully terminate
    setTimeout(() => {
      // Spawn npm run dev as a child process that takes over this terminal
      const devProcess = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit',
        shell: true
      });
      
      // Close the readline interface
      rl.close();
      
      devProcess.on('error', (error) => {
        console.error('❌ Failed to start development server:', error.message);
        process.exit(1);
      });
    }, 1000);
  } catch (error) {
    console.error('❌ Failed to restart development server:', error.message);
    rl.close();
  }
}
