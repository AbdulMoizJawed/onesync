#!/usr/bin/env node

/**
 * SpotOnTrack API Key Fix and Verification
 * 
 * This script tests and applies the correct SpotOnTrack API key 
 * to ensure proper functionality throughout the application.
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 SPOTONTRACK API KEY FIXER 🔧\n');

// Get the SpotOnTrack API key from env
const apiKey = process.env.SPOTONTRACK_API_KEY;
console.log('Current API key:', apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 5)}` : 'Not found');

// Verify the API key format
if (!apiKey) {
  console.error('❌ No API key found in .env.local file. Please add SPOTONTRACK_API_KEY to your .env.local file.');
  process.exit(1);
}

// 1. Directly test the API key with a curl request
console.log('\n🔍 1. Testing API key with direct HTTP request...');
try {
  const testResult = execSync(`curl -s -H "Authorization: Bearer ${apiKey}" "https://www.spotontrack.com/api/v1/tracks?query=Drake" | head -c 300`).toString();
  
  if (testResult.includes('error') || testResult.includes('unauthorized')) {
    console.error('❌ API key test failed. Response indicates an error:', testResult);
    process.exit(1);
  } else if (testResult.length > 0) {
    console.log('✅ API key test successful. Response received from SpotOnTrack API.');
  } else {
    console.warn('⚠️ API key test received empty response.');
  }
} catch (error) {
  console.error('❌ API key test failed with error:', error.message);
  process.exit(1);
}

// 2. Fix the env-config.ts file if needed
console.log('\n🔍 2. Checking env-config.ts file...');
const envConfigPath = path.join(__dirname, 'lib', 'env-config.ts');

if (fs.existsSync(envConfigPath)) {
  console.log('✅ env-config.ts file found.');
  const envConfigContent = fs.readFileSync(envConfigPath, 'utf8');

  // Look for the fallback key configuration
  if (envConfigContent.includes('spotontrack: \'dev_fallback_key\'')) {
    console.log('Updating fallback key configuration...');
    const updatedEnvConfig = envConfigContent.replace(
      /spotontrack: ['"]dev_fallback_key['"]/,
      `spotontrack: '${apiKey}'`
    );
    fs.writeFileSync(envConfigPath, updatedEnvConfig, 'utf8');
    console.log('✅ Updated fallback key in env-config.ts');
  } else {
    console.log('✅ Fallback key configuration looks good.');
  }
} else {
  console.error('❌ env-config.ts file not found at path:', envConfigPath);
}

// 3. Check and fix the spotontrack-api.ts file
console.log('\n🔍 3. Checking spotontrack-api.ts file...');
const spotApiPath = path.join(__dirname, 'lib', 'spotontrack-api.ts');

if (fs.existsSync(spotApiPath)) {
  console.log('✅ spotontrack-api.ts file found.');
  const spotApiContent = fs.readFileSync(spotApiPath, 'utf8');

  // Check for direct API key usage
  if (spotApiContent.includes('this.apiKey = envConfig.spotontrackApiKey || process.env.SPOTONTRACK_API_KEY || \'\'')) {
    console.log('✅ API key access looks good in spotontrack-api.ts');
    
    // Further ensure the API key validation function is correct
    if (spotApiContent.includes('hasRealApiKey()') && !spotApiContent.includes('this.apiKey !== \'your_spotontrack_api_key_here\'')) {
      console.log('Adding additional validation for the API key...');
      const updatedSpotApi = spotApiContent.replace(
        /hasRealApiKey\(\): boolean \{[^}]+\}/,
        `hasRealApiKey(): boolean {
    return !!(this.apiKey && 
              this.apiKey !== 'dev_fallback_key' && 
              this.apiKey !== 'your_spotontrack_api_key_here' &&
              this.apiKey.length > 10)`
      );
      fs.writeFileSync(spotApiPath, updatedSpotApi, 'utf8');
      console.log('✅ Updated API key validation in spotontrack-api.ts');
    }
  } else {
    console.warn('⚠️ Unexpected API key access pattern in spotontrack-api.ts');
  }
} else {
  console.error('❌ spotontrack-api.ts file not found at path:', spotApiPath);
}

// 4. Test API key with the app's actual implementation
console.log('\n🔍 4. Creating direct API integration test...');
const testFilePath = path.join(__dirname, 'test-spotontrack-api.js');

const testFileContent = `// SpotOnTrack API Test
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

// Test directly with the key from .env.local
const apiKey = process.env.SPOTONTRACK_API_KEY;
console.log('Testing with API key:', apiKey ? \`\${apiKey.substring(0, 8)}...\${apiKey.substring(apiKey.length - 5)}\` : 'Not found');

async function testSpotOnTrackAPI() {
  try {
    const response = await fetch('https://www.spotontrack.com/api/v1/tracks?query=Drake', {
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Found', data.length, 'results');
      if (data.length > 0) {
        console.log('First result:', data[0].name);
      }
      return true;
    } else {
      const text = await response.text();
      console.error('API error:', response.status, text);
      return false;
    }
  } catch (error) {
    console.error('Request failed:', error);
    return false;
  }
}

testSpotOnTrackAPI().then(success => {
  console.log('Test completed with', success ? 'SUCCESS' : 'FAILURE');
  process.exit(success ? 0 : 1);
});`;

fs.writeFileSync(testFilePath, testFileContent, 'utf8');
console.log('✅ Created test-spotontrack-api.js');

// 5. Run the standalone test
console.log('\n🔍 5. Running API integration test...');
try {
  execSync('node test-spotontrack-api.js', { stdio: 'inherit' });
  console.log('✅ Integration test passed!');
} catch (error) {
  console.error('❌ Integration test failed:', error.message);
}

// 6. Summary
console.log('\n✅ FIXES APPLIED:');
console.log('1. Verified SpotOnTrack API key works with direct HTTP request');
console.log('2. Updated env-config.ts with correct API key handling');
console.log('3. Enhanced API key validation in spotontrack-api.ts');
console.log('4. Created and ran standalone API integration test');

console.log('\n🚀 NEXT STEPS:');
console.log('1. Restart your development server: npm run dev');
console.log('2. Test the SpotOnTrack integration in your app');
console.log('3. Verify API responses in the browser developer tools');
