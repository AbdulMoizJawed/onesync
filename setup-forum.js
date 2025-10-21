const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupForum() {
  console.log('🚀 Setting up forum database tables and data...\n')
  
  try {
    // Read and execute the forum schema SQL
    const schemaPath = path.join(__dirname, 'scripts', '23-fix-forum-categories-final.sql')
    if (fs.existsSync(schemaPath)) {
      console.log('📝 Executing forum schema migration...')
      const sql = fs.readFileSync(schemaPath, 'utf8')
      
      // Note: Supabase JS client doesn't support raw SQL execution
      // This is for reference - the SQL should be run in Supabase dashboard
      console.log('⚠️  Please run this SQL in your Supabase dashboard:')
      console.log('=' .repeat(60))
      console.log(sql)
      console.log('=' .repeat(60))
    }

    // Test basic forum functionality
    console.log('\n🔍 Testing forum tables...')
    
    // Test categories
    const { data: categories, error: catError } = await supabase
      .from('forum_categories')
      .select('*')
      .limit(1)
    
    if (catError) {
      console.log('❌ Forum categories table not accessible:', catError.message)
      console.log('💡 Make sure to run the SQL migration above')
      return
    }
    
    console.log('✅ Forum categories table accessible')
    
    // Test posts
    const { data: posts, error: postError } = await supabase
      .from('forum_posts')
      .select('*')
      .limit(1)
    
    if (postError) {
      console.log('❌ Forum posts table not accessible:', postError.message)
      return
    }
    
    console.log('✅ Forum posts table accessible')
    
    // Test comments
    const { data: comments, error: commentError } = await supabase
      .from('forum_comments')
      .select('*')
      .limit(1)
    
    if (commentError) {
      console.log('❌ Forum comments table not accessible:', commentError.message)
      return
    }
    
    console.log('✅ Forum comments table accessible')
    
    // Test profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .limit(1)
    
    if (profileError) {
      console.log('❌ Profiles table not accessible:', profileError.message)
      return
    }
    
    console.log('✅ Profiles table accessible')
    
    // Check for default categories
    const { data: allCategories } = await supabase
      .from('forum_categories')
      .select('*')
      .order('sort_order')
    
    console.log(`\n📊 Forum categories (${allCategories?.length || 0}):`)
    allCategories?.forEach(cat => {
      console.log(`  • ${cat.name} (${cat.description})`)
    })
    
    // Check for posts
    const { count: postCount } = await supabase
      .from('forum_posts')
      .select('*', { count: 'exact', head: true })
    
    console.log(`\n💬 Total forum posts: ${postCount || 0}`)
    
    // Check for users with profiles
    const { count: profileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    console.log(`👥 Total user profiles: ${profileCount || 0}`)
    
    console.log('\n🎉 Forum setup check complete!')
    console.log('\nNext steps:')
    console.log('1. Ensure the SQL migration above is run in Supabase dashboard')
    console.log('2. Users need to complete their profiles (username + avatar) to participate')
    console.log('3. Test creating posts and comments through the UI')
    
  } catch (error) {
    console.error('❌ Forum setup failed:', error)
  }
}

setupForum()
