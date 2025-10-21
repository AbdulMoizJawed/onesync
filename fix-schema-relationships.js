const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function fixSchemaRelationships() {
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (error) {
    console.log('dotenv module not found, continuing with process.env');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🔌 Connected to Supabase');
  console.log('🔧 Fixing schema relationships...');

  const sqlCommands = [
    'ALTER TABLE IF EXISTS public.releases DROP CONSTRAINT IF EXISTS releases_user_id_fkey;',
    'ALTER TABLE IF EXISTS public.artists DROP CONSTRAINT IF EXISTS artists_user_id_fkey;',
    'ALTER TABLE IF EXISTS public.mastering_jobs DROP CONSTRAINT IF EXISTS mastering_jobs_user_id_fkey;',
    'ALTER TABLE IF EXISTS public.analytics DROP CONSTRAINT IF EXISTS analytics_user_id_fkey;',
    'ALTER TABLE IF EXISTS public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;',
    'ALTER TABLE IF EXISTS public.sync_submissions DROP CONSTRAINT IF EXISTS sync_submissions_user_id_fkey;',
    'ALTER TABLE public.releases ADD CONSTRAINT releases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;',
    'ALTER TABLE public.artists ADD CONSTRAINT artists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;',
    'ALTER TABLE public.mastering_jobs ADD CONSTRAINT mastering_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;',
    'ALTER TABLE public.analytics ADD CONSTRAINT analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;',
    'ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;',
    'ALTER TABLE public.sync_submissions ADD CONSTRAINT sync_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;'
  ];

  for (const sql of sqlCommands) {
    try {
      console.log(`Executing: ${sql}`);
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.log(`⚠️ Command failed (might be expected): ${error.message}`);
      } else {
        console.log('✅ Command executed successfully');
      }
    } catch (err) {
      console.log(`⚠️ Command failed (might be expected): ${err.message}`);
    }
  }

  console.log('✅ Schema relationship fixes completed');
}

fixSchemaRelationships().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
