require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkArtistsSchema() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get table structure
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'artists')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (error) {
      console.error('Error checking schema:', error);
      return;
    }

    console.log('Artists table columns:');
    console.log('=====================');
    data.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Also check if table exists and get some sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from('artists')
      .select('*')
      .limit(1);

    if (sampleError && sampleError.code !== 'PGRST116') {
      console.error('Error checking sample data:', sampleError);
    } else if (sampleData) {
      console.log('\nSample row keys:');
      console.log('================');
      if (sampleData.length > 0) {
        console.log(Object.keys(sampleData[0]));
      } else {
        console.log('No data in table');
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkArtistsSchema();
