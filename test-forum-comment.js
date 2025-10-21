#!/usr/bin/env node

/**
 * Test Forum Comment Posting
 * Tests if comments can be posted to forum posts
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCommentPosting() {
  console.log('\n🧪 Testing Forum Comment Posting...\n')

  try {
    // 1. Get a test post
    console.log('1. Finding a forum post to test with...')
    const { data: posts, error: postsError } = await supabase
      .from('forum_posts')
      .select('id, title, user_id')
      .limit(1)
      .single()

    if (postsError || !posts) {
      console.log('   ❌ No forum posts found. Create a post first.')
      return
    }

    console.log(`   ✅ Found post: "${posts.title}" (ID: ${posts.id})`)

    // 2. Get a test user
    console.log('\n2. Getting user for testing...')
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError || !users || users.length === 0) {
      console.log('   ❌ No users found')
      return
    }

    const testUser = users[0]
    console.log(`   ✅ Using user: ${testUser.email}`)

    // 3. Try to insert a test comment
    console.log('\n3. Attempting to insert test comment...')
    const testComment = {
      post_id: posts.id,
      user_id: testUser.id,
      content: 'Test comment from verification script - ' + new Date().toISOString(),
      parent_comment_id: null,
      attachments: null
    }

    console.log('   Comment data:', JSON.stringify(testComment, null, 2))

    const { data: comment, error: commentError } = await supabase
      .from('forum_comments')
      .insert(testComment)
      .select()
      .single()

    if (commentError) {
      console.log('   ❌ Failed to insert comment:', commentError.message)
      console.log('   Error details:', commentError)
      
      // Check RLS policies
      console.log('\n4. Checking RLS policies on forum_comments...')
      const { data: policies, error: policyError } = await supabase
        .rpc('exec_sql', { 
          sql: "SELECT policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'forum_comments'" 
        })
        .catch(() => {
          console.log('   ⚠️  Cannot check policies with RPC, but error suggests RLS issue')
        })

      return
    }

    console.log('   ✅ Comment inserted successfully!')
    console.log('   Comment ID:', comment.id)

    // 4. Verify comment can be read
    console.log('\n4. Verifying comment can be read...')
    const { data: readComment, error: readError } = await supabase
      .from('forum_comments')
      .select('*')
      .eq('id', comment.id)
      .single()

    if (readError) {
      console.log('   ❌ Failed to read comment:', readError.message)
    } else {
      console.log('   ✅ Comment can be read successfully')
    }

    // 5. Clean up test comment
    console.log('\n5. Cleaning up test comment...')
    const { error: deleteError } = await supabase
      .from('forum_comments')
      .delete()
      .eq('id', comment.id)

    if (deleteError) {
      console.log('   ⚠️  Could not delete test comment:', deleteError.message)
    } else {
      console.log('   ✅ Test comment deleted')
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ FORUM COMMENTS ARE WORKING!')
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
  }
}

testCommentPosting()

