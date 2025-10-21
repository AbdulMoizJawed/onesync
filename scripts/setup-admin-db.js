const { createClient } = require('@supabase/supabase-js')

// Load environment variables from parent directory
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAdminAccess() {
  console.log('🔧 Setting up admin access in Supabase...')
  
  try {
    // Add role column to profiles table
    console.log('➕ Adding role column to profiles table...')
    const { error: roleError } = await supabase.rpc('sql', {
      query: `
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
        CHECK (role IN ('user', 'admin', 'moderator'));
        
        CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
      `
    })
    
    if (roleError) {
      console.warn('Role column setup warning:', roleError.message)
    } else {
      console.log('✅ Role column setup complete')
    }
    
    // Grant admin access to @onesync.music emails
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',')
    
    for (const email of adminEmails) {
      const cleanEmail = email.trim()
      if (cleanEmail) {
        console.log(`👤 Checking user: ${cleanEmail}`)
        
        // Check if user exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('email', cleanEmail)
          .single()
        
        if (profile && !profileError) {
          if (profile.role !== 'admin') {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ role: 'admin' })
              .eq('id', profile.id)
            
            if (updateError) {
              console.error(`❌ Failed to update ${cleanEmail}:`, updateError.message)
            } else {
              console.log(`✅ Granted admin access to ${cleanEmail}`)
            }
          } else {
            console.log(`✅ ${cleanEmail} already has admin access`)
          }
        } else {
          console.log(`⚠️  User ${cleanEmail} not found (needs to sign up first)`)
        }
      }
    }
    
    console.log('\n🎉 Admin setup complete!')
    console.log('📧 Admin emails configured:', adminEmails.filter(e => e.trim()).join(', '))
    console.log('🔐 Users with these emails will have admin access')
    console.log('\n💡 Next steps:')
    console.log('1. Restart your development server: npm run dev')
    console.log('2. Sign in with your @onesync.music email')
    console.log('3. Visit /admin to access the admin panel')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

setupAdminAccess()
