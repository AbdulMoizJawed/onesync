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

async function checkForumSchema() {
  try {
    // Check what columns exist in forum_posts
    const { data, error } = await supabase
      .from('forum_posts')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Forum posts columns:', data.length > 0 ? Object.keys(data[0]) : 'No data to check columns');
    }

    // Check forum_comments
    const { data: comments, error: commentsError } = await supabase
      .from('forum_comments')
      .select('*')
      .limit(1);
    
    if (commentsError) {
      console.error('Comments error:', commentsError);
    } else {
      console.log('Forum comments columns:', comments.length > 0 ? Object.keys(comments[0]) : 'Table exists but empty');
    }

    // Check forum_votes
    const { data: votes, error: votesError } = await supabase
      .from('forum_votes')
      .select('*')
      .limit(1);
    
    if (votesError) {
      console.error('Votes error:', votesError);
    } else {
      console.log('Forum votes columns:', votes.length > 0 ? Object.keys(votes[0]) : 'Table exists but empty');
    }

  } catch (error) {
    console.error('Schema check error:', error);
  }
}

checkForumSchema();
