#!/usr/bin/env node

/**
 * Test Forum Comment Posting AS A REGULAR USER
 * This simulates the frontend auth flow
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗')
  process.exit(1)
}

// Create client like the frontend does (with anon key)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAsUser() {
  console.log('\n🧪 Testing Forum Comments AS REGULAR USER (like frontend)...\n')

  try {
    // 1. Try to get session (simulate logged in user)
    console.log('1. Checking if we can get user session...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('   ❌ No authenticated session')
      console.log('   This test needs to run with user credentials')
      console.log('   The frontend MUST have a valid user session')
      
      // Try to sign in
      console.log('\n2. Attempting to sign in...')
      console.log('   Enter a test user email and password:')
      console.log('   (This is just for testing - in production, users are already logged in)')
      
      return
    }

    console.log(`   ✅ User session found: ${user.email}`)
    console.log(`   User ID: ${user.id}`)

    // 2. Get a test post
    console.log('\n2. Finding a forum post...')
    const { data: posts, error: postsError } = await supabase
      .from('forum_posts')
      .select('id, title')
      .limit(1)
      .single()

    if (postsError || !posts) {
      console.log('   ❌ No forum posts found:', postsError?.message)
      return
    }

    console.log(`   ✅ Found post: "${posts.title}"`)

    // 3. Try to insert comment AS THE USER (with RLS)
    console.log('\n3. Attempting to post comment with RLS...')
    const testComment = {
      post_id: posts.id,
      user_id: user.id, // Using authenticated user's ID
      content: 'Test comment as user - ' + new Date().toISOString(),
      parent_comment_id: null,
      attachments: null
    }

    const { data: comment, error: commentError } = await supabase
      .from('forum_comments')
      .insert(testComment)
      .select()
      .single()

    if (commentError) {
      console.log('   ❌ FAILED TO POST COMMENT')
      console.log('   Error:', commentError.message)
      console.log('   Code:', commentError.code)
      console.log('   Details:', commentError.details)
      console.log('   Hint:', commentError.hint)
      
      if (commentError.code === '42501') {
        console.log('\n   🔴 RLS POLICY ISSUE!')
        console.log('   The user does not have permission to insert comments.')
        console.log('   Run fix-forum-comment-policies.sql in Supabase SQL Editor!')
      }
      
      return
    }

    console.log('   ✅ COMMENT POSTED SUCCESSFULLY!')
    console.log('   Comment ID:', comment.id)

    // Clean up
    console.log('\n4. Cleaning up test comment...')
    await supabase.from('forum_comments').delete().eq('id', comment.id)
    console.log('   ✅ Cleaned up')

    console.log('\n' + '='.repeat(60))
    console.log('✅ FORUM COMMENTS WORK WITH USER AUTH!')
    console.log('The issue is likely in the frontend JavaScript/React code.')
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
  }
}

testAsUser()

