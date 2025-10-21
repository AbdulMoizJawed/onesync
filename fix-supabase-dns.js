require('dotenv').config({ path: '.env.local' });
const dns = require('dns');
const fs = require('fs');

// Get the current Supabase URL
const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
console.log('Current Supabase URL:', currentUrl);

// Extract the hostname from the URL
const urlObj = new URL(currentUrl);
const hostname = urlObj.hostname;
console.log('Hostname to check:', hostname);

// Test DNS resolution
dns.lookup(hostname, (err, address, family) => {
  if (err) {
    console.error('DNS Lookup Error:', err.message);
    console.log('\n📡 DNS resolution failed. Let\'s check your internet connection and Supabase project status.\n');
    
    // Suggestions
    console.log('Possible solutions:');
    console.log('1. Check your internet connection');
    console.log('2. Verify if the Supabase project still exists (it may have been deleted)');
    console.log('3. Verify DNS settings on your machine');
    console.log('4. Try accessing the Supabase dashboard to confirm project status');
    console.log('5. If the project was recreated, update your .env.local file with the new URL\n');
    
    // Additional checks - try with 'ping' command
    const { execSync } = require('child_process');
    try {
      console.log('Attempting to ping google.com to verify internet connection:');
      const pingResult = execSync('ping -c 2 google.com').toString();
      console.log(pingResult);
      console.log('✅ Internet connection appears to be working');
    } catch (e) {
      console.log('❌ Internet connection issue detected');
    }
    
    // Check Supabase dashboard
    console.log('\nPlease check your Supabase project at: https://app.supabase.com/project/_');
    console.log('Then update your .env.local file if needed.\n');
  } else {
    console.log(`✅ DNS resolution successful: ${hostname} resolves to ${address} (IPv${family})`);
    console.log('Your Supabase URL appears to be valid.');
    
    // Try a HTTPS request to validate the endpoint
    const https = require('https');
    const req = https.get(currentUrl, (res) => {
      console.log(`HTTPS connection successful, status code: ${res.statusCode}`);
      res.on('data', () => {}); // Consume the data
      
      // If we got a response but auth is still failing, there might be other issues
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('\nYour Supabase endpoint is responding correctly, but auth may still be failing.');
        console.log('Possible issues:');
        console.log('1. Check if your anon key is correct');
        console.log('2. Verify auth settings in your Supabase project');
        console.log('3. Check browser console for CORS errors');
        console.log('4. Make sure your client code is using the correct URL and key\n');
      }
    });
    
    req.on('error', (httpErr) => {
      console.error('HTTPS Error:', httpErr.message);
      console.log('\nYour Supabase hostname resolves, but the HTTPS endpoint is not responding correctly.');
    });
    
    req.end();
  }
});
