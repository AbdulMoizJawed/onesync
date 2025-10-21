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

async function checkForumData() {
  try {
    // Check posts
    const { data: posts, error: postsError } = await supabase
      .from('forum_posts')
      .select('*')
      .limit(3);
    
    console.log('Forum posts:', posts?.length || 0);
    if (posts && posts.length > 0) {
      console.log('Post columns:', Object.keys(posts[0]));
    }

    // Try to insert a test comment to see what columns are needed
    const { error: commentError } = await supabase
      .from('forum_comments')
      .insert({
        post_id: posts?.[0]?.id,
        user_id: posts?.[0]?.user_id,
        content: 'Test comment'
      })
      .select('*')
      .single();

    if (commentError) {
      console.log('Comment insert error (this will show required columns):', commentError.message);
    } else {
      console.log('Comment inserted successfully');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkForumData();
