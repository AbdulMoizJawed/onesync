#!/usr/bin/env node

/**
 * SpotOnTrack API End-to-End Verification
 * This script verifies the SpotOnTrack API integration across all layers
 */

require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Test settings
const API_KEY = process.env.SPOTONTRACK_API_KEY;
const TEST_ENDPOINTS = [
  'tracks?query=Drake',
  'tracks?query=Billie+Eilish',
  'tracks?query=Bad+Bunny'
];

console.log('🔍 SPOTONTRACK API END-TO-END VERIFICATION');
console.log('==========================================\n');

// 1. Verify .env.local configuration
console.log('1️⃣ CHECKING ENVIRONMENT CONFIGURATION');
console.log(`API Key Length: ${API_KEY ? API_KEY.length : 0} characters`);
console.log(`API Key Format: ${API_KEY ? `${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 5)}` : 'NOT SET'}`);

if (!API_KEY || API_KEY === 'dev_fallback_key' || API_KEY === 'your_spotontrack_api_key_here') {
  console.error('❌ INVALID API KEY IN .env.local');
  process.exit(1);
} else {
  console.log('✅ API KEY FOUND IN ENVIRONMENT\n');
}

// 2. Direct API tests
async function testDirectApiCalls() {
  console.log('2️⃣ DIRECT API CALLS (NO MIDDLEWARE)');
  
  let successCount = 0;
  
  for (const endpoint of TEST_ENDPOINTS) {
    try {
      console.log(`Testing: https://www.spotontrack.com/api/v1/${endpoint}`);
      
      const response = await fetch(`https://www.spotontrack.com/api/v1/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SUCCESS - Found ${data.length} results`);
        successCount++;
      } else {
        const text = await response.text();
        console.error(`❌ ERROR - Status: ${response.status}, Response: ${text}`);
      }
    } catch (error) {
      console.error(`❌ REQUEST FAILED: ${error.message}`);
    }
  }
  
  console.log(`Overall Direct API Tests: ${successCount}/${TEST_ENDPOINTS.length} passed\n`);
  return successCount;
}

// 3. Test the app's API endpoints
async function testAppEndpoints() {
  console.log('3️⃣ APPLICATION API ENDPOINTS');
  console.log('Starting a temporary server for testing...');
  
  // Start the dev server in the background if needed
  let serverRunning = false;
  try {
    const psCheck = execSync('ps aux | grep "npm run dev" | grep -v grep').toString();
    if (psCheck) {
      console.log('✅ Development server already running');
      serverRunning = true;
    }
  } catch (e) {
    console.log('⚠️ No running server detected, starting one temporarily...');
    try {
      const child = require('child_process').spawn('npm', ['run', 'dev'], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      console.log('✅ Temporary server started, waiting for it to be ready...');
      // Wait for the server to be ready
      await new Promise(resolve => setTimeout(resolve, 5000));
      serverRunning = true;
    } catch (err) {
      console.error('❌ Failed to start development server:', err);
      return 0;
    }
  }
  
  if (!serverRunning) {
    console.error('❌ Cannot test application endpoints without a running server');
    return 0;
  }
  
  // Test the application endpoints
  const APP_ENDPOINTS = [
    'http://localhost:3000/api/test-spotontrack?artist=Taylor+Swift',
    'http://localhost:3000/api/spotontrack-search?q=Drake&type=artist',
    'http://localhost:3000/api/spotontrack-artist?name=Drake'
  ];
  
  let appSuccessCount = 0;
  
  for (const endpoint of APP_ENDPOINTS) {
    try {
      console.log(`Testing app endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SUCCESS - Endpoint responded correctly`);
        
        if (endpoint.includes('test-spotontrack')) {
          console.log(`   Test successful: ${data.success ? 'PASSED ✅' : 'FAILED ❌'}`);
          
          if (data.success) {
            appSuccessCount++;
          }
        } else {
          console.log(`   Response success: ${data.success ? 'PASSED ✅' : 'FAILED ❌'}`);
          
          if (data.success) {
            appSuccessCount++;
          }
        }
      } else {
        const text = await response.text();
        console.error(`❌ ERROR - Status: ${response.status}, Response: ${text}`);
      }
    } catch (error) {
      console.error(`❌ REQUEST FAILED: ${error.message}`);
    }
  }
  
  console.log(`Overall App Endpoint Tests: ${appSuccessCount}/${APP_ENDPOINTS.length} passed\n`);
  return appSuccessCount;
}

// 4. Verify the API code is correctly loading the key
function verifyApiCodeIntegrity() {
  console.log('4️⃣ API CODE INTEGRATION VERIFICATION');
  
  const apiFilePath = path.join(__dirname, 'lib', 'spotontrack-api.ts');
  if (!fs.existsSync(apiFilePath)) {
    console.error('❌ API file not found at:', apiFilePath);
    return false;
  }
  
  const apiCode = fs.readFileSync(apiFilePath, 'utf8');
  
  // Check for key fixes
  const checks = [
    {
      name: 'Priority loading from process.env',
      pattern: /this\.apiKey = process\.env\.SPOTONTRACK_API_KEY.*envConfig\.spotontrackApiKey/,
      required: true
    },
    {
      name: 'Enhanced API key validation',
      pattern: /hasRealApiKey.*this\.apiKey !== 'dev_fallback_key'.*this\.apiKey !== 'your_spotontrack_api_key_here'/s,
      required: true
    },
    {
      name: 'Proper Accept header',
      pattern: /'Accept': 'application\/json'/,
      required: true
    },
    {
      name: 'Emergency verification method',
      pattern: /verifyApiKey/,
      required: false
    }
  ];
  
  let passedChecks = 0;
  
  for (const check of checks) {
    const passed = check.pattern.test(apiCode);
    console.log(`${passed ? '✅' : '❌'} ${check.name}: ${passed ? 'FOUND' : 'NOT FOUND'}${!passed && check.required ? ' (REQUIRED)' : ''}`);
    
    if (passed || !check.required) {
      passedChecks++;
    }
  }
  
  console.log(`Code Integration Verification: ${passedChecks}/${checks.length} checks passed\n`);
  return passedChecks === checks.length;
}

// Run all tests
async function runAllTests() {
  const directApiSuccess = await testDirectApiCalls();
  const codeIntegritySuccess = verifyApiCodeIntegrity();
  const appEndpointSuccess = await testAppEndpoints();
  
  // Calculate overall result
  const directApiPassed = directApiSuccess === TEST_ENDPOINTS.length;
  const appEndpointPassed = appEndpointSuccess >= 1; // At least one endpoint should work
  
  console.log('\n🔍 VERIFICATION SUMMARY');
  console.log('=====================');
  console.log(`1. Environment Configuration: ${API_KEY ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`2. Direct API Calls: ${directApiPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`3. Application API Endpoints: ${appEndpointPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`4. Code Integration: ${codeIntegritySuccess ? '✅ PASS' : '❌ FAIL'}`);
  
  const overallStatus = API_KEY && directApiPassed && appEndpointPassed && codeIntegritySuccess;
  
  console.log(`\n🚨 OVERALL STATUS: ${overallStatus ? '✅ VERIFIED' : '❌ ISSUES DETECTED'}`);
  
  if (!overallStatus) {
    console.log('\n📋 RECOMMENDED ACTIONS:');
    
    if (!API_KEY) {
      console.log('- Update the SPOTONTRACK_API_KEY in .env.local with the correct key');
    }
    
    if (!directApiPassed) {
      console.log('- Verify the API key is valid by testing it directly with the SpotOnTrack API');
      console.log('- Check if the SpotOnTrack API service is currently available');
    }
    
    if (!appEndpointPassed) {
      console.log('- Check the server logs for any API-related errors');
      console.log('- Ensure the development server is running correctly');
      console.log('- Verify the application is properly loading environment variables');
    }
    
    if (!codeIntegritySuccess) {
      console.log('- Fix the code integration issues identified in lib/spotontrack-api.ts');
      console.log('- Ensure the API key is being loaded with priority from process.env');
      console.log('- Verify proper headers are being sent with API requests');
    }
  } else {
    console.log('\n✨ CONGRATULATIONS! The SpotOnTrack API integration is working correctly.');
    console.log('   You can now use the SpotOnTrack API features in your application.');
  }
}

// Run all tests
runAllTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
