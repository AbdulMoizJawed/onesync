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

async function createMissingForumTables() {
  try {
    console.log('Creating missing forum tables...');

    // Create forum_votes table
    const { error: votesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS forum_votes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
          comment_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
          vote_type TEXT CHECK (vote_type IN ('up', 'down')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, post_id),
          UNIQUE(user_id, comment_id)
        );
      `
    });

    if (votesError) {
      console.error('Error creating forum_votes table:', votesError);
    } else {
      console.log('✅ Forum votes table created');
    }

    // Add missing columns to forum_posts if needed
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE forum_posts 
        ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
      `
    });

    if (alterError) {
      console.error('Error adding columns to forum_posts:', alterError);
    } else {
      console.log('✅ Forum posts table updated');
    }

  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

createMissingForumTables();
