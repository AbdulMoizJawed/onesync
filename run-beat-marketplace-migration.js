#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Starting beat marketplace migration...')
    
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'scripts', '26-beat-marketplace-tables.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📖 Read migration file:', migrationPath)
    
    // Test basic connection first
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
    
    if (connectionError) {
      throw new Error(`Connection failed: ${connectionError.message}`)
    }
    
    console.log('✅ Supabase connection successful')
    
    // For this type of migration, we'll provide the SQL for manual execution
    // since complex DDL operations often need direct database access
    console.log('📋 Beat Marketplace Migration SQL:')
    console.log('Copy and paste this into your Supabase SQL Editor:\n')
    console.log('='.repeat(80))
    console.log(migrationSQL)
    console.log('='.repeat(80))
    
    console.log('\n🔗 Instructions:')
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Paste the SQL above')
    console.log('4. Click "Run" to execute the migration')
    console.log('5. This will create:')
    console.log('   - beat_likes table (for user likes on beats)')
    console.log('   - producer_follows table (for following producers)')
    console.log('   - beat_purchases table (for beat sales tracking)')
    console.log('   - Proper indexes and RLS policies')
    console.log('   - Helper functions for statistics')
    
  } catch (error) {
    console.error('❌ Migration setup failed:', error.message)
    
    // Still provide the SQL for manual execution
    const migrationPath = path.join(__dirname, 'scripts', '26-beat-marketplace-tables.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    console.log('\n📋 Manual Migration Required:')
    console.log('='.repeat(80))
    console.log(migrationSQL)
    console.log('='.repeat(80))
  }
}

// Run the migration
runMigration()
