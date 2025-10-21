import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function run() {
  console.log('Creating notifications table if it doesn\'t exist...')
  
  // Check if table exists
  const { data: tables, error: tableError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'notifications')
  
  if (tableError) {
    console.log('Could not check table existence, attempting to create...')
  } else if (tables && tables.length > 0) {
    console.log('✓ Notifications table already exists')
    return
  }
  
  // Create the table using raw SQL
  const { error: createError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('release', 'payout', 'system', 'promotion', 'warning')),
        read BOOLEAN NOT NULL DEFAULT false,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
      
      -- Enable RLS
      ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      CREATE POLICY "Users can view their own notifications" ON notifications
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can update their own notifications" ON notifications
        FOR UPDATE USING (auth.uid() = user_id);
    `
  })
  
  if (createError) {
    console.error('Error creating notifications table:', createError)
    
    // Fallback: try individual statements
    console.log('Trying fallback creation method...')
    
    const statements = [
      `CREATE TABLE IF NOT EXISTS notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'system',
        read BOOLEAN NOT NULL DEFAULT false,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`,
      `ALTER TABLE notifications ENABLE ROW LEVEL SECURITY`
    ]
    
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      if (error) {
        console.error(`Error executing: ${statement}`, error)
      }
    }
  } else {
    console.log('✓ Notifications table created successfully')
  }
  
  // Test insertion
  console.log('Testing notification creation...')
  const { data: testNotif, error: testError } = await supabase
    .from('notifications')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000', // dummy ID for test
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'system'
    })
    .select()
  
  if (testError) {
    console.error('Error testing notification creation:', testError)
  } else {
    console.log('✓ Notification creation test successful')
    
    // Clean up test notification
    await supabase
      .from('notifications')
      .delete()
      .eq('title', 'Test Notification')
  }
}

run().catch(e => { console.error(e); process.exit(1) })
