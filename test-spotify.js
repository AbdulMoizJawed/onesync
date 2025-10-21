const https = require('https');
const querystring = require('querystring');

// Test fallback credentials
const clientId = '474879af111c44ec8f835be52ac8ef01';
const clientSecret = '43bf4784ce07415293d751f451b5e21a';

const data = querystring.stringify({
  'grant_type': 'client_credentials'
});

const options = {
  hostname: 'accounts.spotify.com',
  port: 443,
  path: '/api/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
    'Content-Length': data.length
  }
};

console.log('Testing fallback Spotify credentials...');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', body);
    try {
      const parsed = JSON.parse(body);
      if (parsed.access_token) {
        console.log('✅ Fallback credentials work! Token received:', parsed.access_token.substring(0, 20) + '...');
      } else {
        console.log('❌ Fallback credentials failed:', parsed);
      }
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
