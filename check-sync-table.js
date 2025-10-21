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

async function checkTable() {
  try {
    // First, let's see if we can query the table
    const { data, error } = await supabase
      .from('sync_opportunities')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Error querying table:', error.message);
    } else {
      console.log('Table query successful. Row count:', data.length);
    }

    // Let's try to insert a simple record to see what constraints exist
    const { error: insertError } = await supabase
      .from('sync_opportunities')
      .insert({
        title: 'Test Opportunity',
        type: 'Film',
        company: 'Test Company',
        description: 'Test description',
        budget_min: 1000,
        budget_max: 5000,
        deadline: '2024-12-31T00:00:00Z',
        status: 'open'
      });
    
    if (insertError) {
      console.log('Insert error:', insertError.message);
      console.log('Error code:', insertError.code);
      console.log('Error details:', insertError.details);
    } else {
      console.log('Insert successful!');
      
      // Clean up - delete the test record
      await supabase
        .from('sync_opportunities')
        .delete()
        .eq('title', 'Test Opportunity')
        .eq('company', 'Test Company');
      
      console.log('Test record cleaned up');
    }

  } catch (e) {
    console.log('Caught error:', e.message);
  }
}

checkTable();
