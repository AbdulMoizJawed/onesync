#!/usr/bin/env node

/**
 * Forum Setup Verification Script
 * 
 * Checks if forum tables exist and have correct structure
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyForumSetup() {
  console.log('\n🔍 Verifying Forum Setup...\n')

  try {
    // Check forum_categories
    console.log('1. Checking forum_categories table...')
    const { data: categories, error: catError } = await supabase
      .from('forum_categories')
      .select('*')
      .limit(1)

    if (catError) {
      console.log('   ❌ forum_categories table issue:', catError.message)
      console.log('   💡 Run SETUP-FORUM-COMPLETE.sql in Supabase SQL Editor')
    } else {
      console.log('   ✅ forum_categories table exists')
      
      const { count } = await supabase
        .from('forum_categories')
        .select('*', { count: 'exact', head: true })
      
      console.log(`   📊 ${count} categories found`)
    }

    // Check forum_posts
    console.log('\n2. Checking forum_posts table...')
    const { data: posts, error: postsError } = await supabase
      .from('forum_posts')
      .select('id, user_id, title, attachments')
      .limit(1)

    if (postsError) {
      console.log('   ❌ forum_posts table issue:', postsError.message)
      console.log('   💡 Run SETUP-FORUM-COMPLETE.sql in Supabase SQL Editor')
    } else {
      console.log('   ✅ forum_posts table exists')
      
      const { count } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
      
      console.log(`   📊 ${count} posts found`)
      
      // Check for attachments column
      if (posts && posts.length > 0) {
        console.log('   ✅ attachments column exists')
      }
    }

    // Check forum_comments
    console.log('\n3. Checking forum_comments table...')
    const { data: comments, error: commentsError } = await supabase
      .from('forum_comments')
      .select('id, user_id, post_id, content, attachments')
      .limit(1)

    if (commentsError) {
      console.log('   ❌ forum_comments table issue:', commentsError.message)
      console.log('   💡 Run SETUP-FORUM-COMPLETE.sql in Supabase SQL Editor')
    } else {
      console.log('   ✅ forum_comments table exists')
      
      const { count } = await supabase
        .from('forum_comments')
        .select('*', { count: 'exact', head: true })
      
      console.log(`   📊 ${count} comments found`)
      
      // Check for attachments column
      if (comments && comments.length > 0) {
        console.log('   ✅ attachments column exists')
      }
    }

    // Check storage bucket
    console.log('\n4. Checking forum-attachments storage bucket...')
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets()

    if (bucketError) {
      console.log('   ❌ Storage error:', bucketError.message)
    } else {
      const forumBucket = buckets.find(b => b.name === 'forum-attachments')
      if (forumBucket) {
        console.log('   ✅ forum-attachments bucket exists')
      } else {
        console.log('   ❌ forum-attachments bucket not found')
        console.log('   💡 Run setup-forum-attachments-storage.sql in Supabase SQL Editor')
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('\n📋 SUMMARY:')
    console.log('   If you see any ❌ above, run the SQL scripts in Supabase:')
    console.log('   1. SETUP-FORUM-COMPLETE.sql (for tables)')
    console.log('   2. setup-forum-attachments-storage.sql (for media uploads)')
    console.log('   3. create-forum-social-features.sql (for likes/DMs/follows)')
    console.log('\n' + '='.repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ Verification failed:', error)
  }
}

verifyForumSetup()

