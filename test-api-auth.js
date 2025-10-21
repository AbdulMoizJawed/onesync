// Test authentication and API calls
require('dotenv').config({ path: '.env.local' });

async function testAuth() {
  console.log('🔍 Testing authentication and API calls...');
  
  try {
    // Test the API endpoint directly
    const response = await fetch('http://localhost:3000/api/artist-tools/get-releases', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('API Response Data:', data);
    
    if (response.status === 401) {
      console.log('❌ 401 Unauthorized - User needs to sign in');
      console.log('This happens when:');
      console.log('1. User is not signed in');
      console.log('2. Session cookies are missing or expired');
      console.log('3. Authentication state is not properly maintained');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testAuth();
