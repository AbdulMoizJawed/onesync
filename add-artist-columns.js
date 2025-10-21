// Simple script to add missing columns to artists table
const fs = require('fs');
const path = require('path');

// Read the .env.local file
const envPath = path.join(__dirname, '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) {
    env[key.trim()] = rest.join('=').trim();
  }
});

// Set environment variables
Object.keys(env).forEach(key => {
  process.env[key] = env[key];
});

const { createClient } = require('@supabase/supabase-js');

async function addMissingColumns() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('Adding missing columns to artists table...');
    
    // Add image column (using image_url to match existing schema)
    const { error: imageError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'artists' 
            AND column_name = 'image' 
            AND table_schema = 'public'
          ) THEN
            ALTER TABLE public.artists ADD COLUMN image TEXT;
          END IF;
        END $$;
      `
    });

    if (imageError) {
      console.log('Note: Could not add image column, may already exist');
    } else {
      console.log('✅ Added image column');
    }

    // Add spotify_url column
    const { error: spotifyError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'artists' 
            AND column_name = 'spotify_url' 
            AND table_schema = 'public'
          ) THEN
            ALTER TABLE public.artists ADD COLUMN spotify_url TEXT;
          END IF;
        END $$;
      `
    });

    if (spotifyError) {
      console.log('Note: Could not add spotify_url column, may already exist');
    } else {
      console.log('✅ Added spotify_url column');
    }

    console.log('✅ Schema update complete!');

  } catch (error) {
    console.error('Error:', error);
  }
}

addMissingColumns();
