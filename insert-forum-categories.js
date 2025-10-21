const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function insertCategories() {
  console.log('🔄 Inserting forum categories...')
  
  // First, check what columns exist in the table
  const { data: existingCategories, error: checkError } = await supabase
    .from('forum_categories')
    .select('*')
    .limit(1)
  
  if (checkError) {
    console.error('❌ Error checking table structure:', checkError.message)
    return
  }
  
  console.log('📋 Existing table structure detected')
  
  const categories = [
    {
      name: 'General Discussion',
      description: 'General music industry discussions and chat'
    },
    {
      name: 'Music Production',
      description: 'Tips, tricks, and discussions about music production'
    },
    {
      name: 'Marketing & Promotion',
      description: 'Strategies for promoting and marketing your music'
    },
    {
      name: 'Industry News',
      description: 'Latest news and updates from the music industry'
    },
    {
      name: 'Collaboration',
      description: 'Find collaborators and network with other artists'
    },
    {
      name: 'Technical Support',
      description: 'Get help with technical issues and platform support'
    }
  ]

  try {
    for (const category of categories) {
      console.log(`🏷️  Adding category: ${category.name}`)
      
      // Check if category already exists
      const { data: existing } = await supabase
        .from('forum_categories')
        .select('id')
        .eq('name', category.name)
        .single()
      
      if (existing) {
        console.log(`⏭️  Category already exists: ${category.name}`)
        continue
      }
      
      const { data, error } = await supabase
        .from('forum_categories')
        .insert(category)
        .select()
      
      if (error) {
        console.error(`❌ Error adding ${category.name}:`, error.message)
      } else {
        console.log(`✅ Added: ${category.name}`)
      }
    }
    
    // Verify categories were added
    const { data: allCategories, error: fetchError } = await supabase
      .from('forum_categories')
      .select('*')
      .order('name')
    
    if (fetchError) {
      console.error('❌ Error fetching categories:', fetchError.message)
    } else {
      console.log(`\n📊 Total categories: ${allCategories?.length || 0}`)
      allCategories?.forEach(cat => {
        console.log(`  • ${cat.name}${cat.description ? ` (${cat.description})` : ''}`)
      })
    }
    
    console.log('\n✅ Forum categories setup complete!')
    
  } catch (error) {
    console.error('❌ Failed to insert categories:', error)
  }
}

insertCategories()
