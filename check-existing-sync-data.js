const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) {
    env[key.trim()] = rest.join('=').trim();
  }
});
Object.keys(env).forEach(key => {
  process.env[key] = env[key];
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkExistingData() {
  try {
    // Let's see what data exists in the table
    const { data, error } = await supabase
      .from('sync_opportunities')
      .select('*');
    
    if (error) {
      console.log('Error querying table:', error.message);
    } else {
      console.log('Existing sync opportunities data:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.length > 0) {
        console.log('\nColumn names found:');
        console.log(Object.keys(data[0]));
      }
    }

  } catch (e) {
    console.log('Caught error:', e.message);
  }
}

checkExistingData();
