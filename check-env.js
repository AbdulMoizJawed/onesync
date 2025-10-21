#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Helper function to check if a value looks like a placeholder
function isPlaceholder(value) {
  if (!value) return false;
  
  const placeholders = ['your-', 'placeholder', 'xxxx', 'example', 'CHANGE_ME'];
  return placeholders.some(p => value.toString().toLowerCase().includes(p));
}

// Helper function for colorized output
function colorize(text, type) {
  switch(type) {
    case 'success': return `\x1b[32m${text}\x1b[0m`; // Green
    case 'error': return `\x1b[31m${text}\x1b[0m`;   // Red
    case 'warning': return `\x1b[33m${text}\x1b[0m`; // Yellow
    case 'info': return `\x1b[36m${text}\x1b[0m`;    // Cyan
    case 'header': return `\x1b[1m\x1b[34m${text}\x1b[0m`; // Bold Blue
    default: return text;
  }
}

// Print header
console.log(colorize('\n===== OneSync Environment Variables Check =====\n', 'header'));

// Track issues for summary
let missingVars = 0;
let placeholderVars = 0;

// Function to check a set of environment variables
function checkEnvSection(title, variables) {
  console.log(colorize(`\n${title}:`, 'header'));
  
  variables.forEach(varName => {
    const value = process.env[varName];
    
    if (!value) {
      console.log(`${colorize('❌', 'error')} ${varName}: ${colorize('Not set', 'error')}`);
      missingVars++;
    } else if (isPlaceholder(value)) {
      console.log(`${colorize('⚠️', 'warning')} ${varName}: ${colorize('Contains placeholder value', 'warning')}`);
      placeholderVars++;
    } else {
      // For security, only show a hint of the actual value
      const maskedValue = value.length > 8 
        ? `${value.substring(0, 3)}...${value.substring(value.length - 3)}`
        : '********';
      console.log(`${colorize('✅', 'success')} ${varName}: Set ${colorize(`(${maskedValue})`, 'info')}`);
    }
  });
}

// Check Supabase variables
checkEnvSection('Supabase Configuration', [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
]);

// Check Storage variables
checkEnvSection('Storage Configuration', [
  'NEXT_PUBLIC_STORAGE_BUCKET',
  'NEXT_PUBLIC_STORAGE_URL',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'S3_BUCKET_NAME',
  'S3_BUCKET_NAME_DEV'
]);

// Check FTP variables
checkEnvSection('FTP Configuration', [
  'FTP_HOST',
  'FTP_PORT',
  'FTP_USER',
  'FTP_PASSWORD'
]);

// Check API Integration variables
checkEnvSection('API Integration', [
  'SPOTONTRACK_API_KEY',
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET'
]);

// Check Authentication variables
checkEnvSection('Authentication', [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_AUTH_REDIRECT_URL'
]);

// Check Email Service variables
checkEnvSection('Email Service', [
  'EMAIL_SERVER_HOST',
  'EMAIL_SERVER_PORT',
  'EMAIL_SERVER_USER',
  'EMAIL_SERVER_PASSWORD',
  'EMAIL_FROM'
]);

// Check Next.js environment
console.log(colorize('\nNext.js Environment:', 'header'));
console.log(`${process.env.NODE_ENV ? colorize('✅', 'success') : colorize('⚠️', 'warning')} NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);

// Check .env.local file
const envFilePath = path.join(process.cwd(), '.env.local');
console.log(colorize('\n.env.local File:', 'header'));
console.log(`Path: ${envFilePath}`);

if (fs.existsSync(envFilePath)) {
  console.log(`${colorize('✅', 'success')} File exists`);
  
  // Get file stats
  const stats = fs.statSync(envFilePath);
  const fileSizeKB = Math.round(stats.size / 1024 * 100) / 100;
  const lastModified = new Date(stats.mtime).toLocaleString();
  
  console.log(`Size: ${fileSizeKB} KB`);
  console.log(`Last modified: ${lastModified}`);
  
  // Count variables in file
  const envContent = fs.readFileSync(envFilePath, 'utf8');
  const varCount = envContent.split('\n').filter(line => 
    line.trim() && !line.trim().startsWith('#') && line.includes('=')).length;
  
  console.log(`Variables defined: ${varCount}`);
} else {
  console.log(`${colorize('❌', 'error')} File does not exist`);
}

// Print summary
console.log(colorize('\n===== Summary =====', 'header'));
console.log(`${colorize('Total missing variables:', missingVars > 0 ? 'error' : 'success')} ${missingVars}`);
console.log(`${colorize('Total placeholder values:', placeholderVars > 0 ? 'warning' : 'success')} ${placeholderVars}`);

if (missingVars > 0 || placeholderVars > 0) {
  console.log(colorize('\nRecommendations:', 'info'));
  if (missingVars > 0) {
    console.log(colorize('- Run ./setup-supabase.sh to configure Supabase credentials', 'info'));
    console.log(colorize('- Check your .env.local file and add missing variables', 'info'));
  }
  if (placeholderVars > 0) {
    console.log(colorize('- Replace placeholder values with actual credentials', 'info'));
  }
}

console.log(colorize('\n===== End of Environment Check =====\n', 'header'));

// Exit with code 1 if critical variables are missing
const criticalMissing = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                       !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
                      
if (criticalMissing) {
  console.log(colorize('❌ ERROR: Critical variables are missing. Application may not function correctly.', 'error'));
  process.exit(1);
}
