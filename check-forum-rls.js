#!/usr/bin/env node

/**
 * Check Forum RLS Policies
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRLS() {
  console.log('\n🔍 Checking Forum RLS Policies...\n')

  try {
    // Check if RLS is enabled
    const { data: tables, error } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .in('tablename', ['forum_posts', 'forum_comments', 'forum_categories'])

    console.log('RLS Status:')
    console.log(tables || 'Could not check RLS status')

    // Try a simpler query to get policies
    console.log('\n\nAttempting to check policies...')
    console.log('If you see policies listed below, RLS is configured.')
    console.log('If not, run fix-forum-comment-policies.sql\n')

    // Get list of all users for reference
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, username')
      .limit(3)

    console.log('Sample users in database:')
    profiles?.forEach(p => {
      console.log(`  - ${p.email || p.username} (ID: ${p.id})`)
    })

    console.log('\n' + '='.repeat(60))
    console.log('💡 TO FIX COMMENT POSTING:')
    console.log('   1. Run fix-forum-comment-policies.sql in Supabase SQL Editor')
    console.log('   2. This will reset all RLS policies correctly')
    console.log('   3. Then try posting a comment again')
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('Error:', error)
  }
}

checkRLS()

