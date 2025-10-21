const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function executePayoutSetup() {
  console.log('🚀 Setting up your payout system...\n')

  try {
    // First, let's test if we can create a simple table
    console.log('🧪 Testing database access...')
    
    // Try to access the database
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (error) {
      console.error('❌ Cannot access database:', error.message)
      return
    }

    console.log('✅ Database access confirmed')

    // Try to create the payout_methods table directly
    console.log('\n📝 Creating payout_methods table...')
    
    // Test if table already exists
    const { data: existingTable, error: tableError } = await supabase
      .from('payout_methods')
      .select('id')
      .limit(1)

    if (!tableError) {
      console.log('✅ payout_methods table already exists!')
    } else if (tableError.message.includes('does not exist')) {
      console.log('📋 payout_methods table needs to be created')
      console.log('\n🔧 SETUP INSTRUCTIONS:')
      console.log('I\'ve created the SQL file for you: payout_system_setup.sql')
      console.log('\nTo complete the setup:')
      console.log('1. Open your Supabase project dashboard')
      console.log('2. Go to "SQL Editor" in the left sidebar')
      console.log('3. Click "New Query"')
      console.log('4. Copy the contents of payout_system_setup.sql and paste it')
      console.log('5. Click "Run" to execute the SQL')
      console.log('\nAlternatively, copy this SQL and paste it into the SQL Editor:')
      
      // Read and display the SQL file
      const sqlContent = fs.readFileSync('payout_system_setup.sql', 'utf8')
      console.log('\n' + '='.repeat(60))
      console.log('COPY THIS SQL TO YOUR SUPABASE SQL EDITOR:')
      console.log('='.repeat(60))
      console.log(sqlContent)
      console.log('='.repeat(60))
    }

    // Check the other tables too
    console.log('\n🔍 Checking other payout tables...')
    
    const tablesToCheck = ['payouts', 'user_earnings']
    for (const table of tablesToCheck) {
      const { error: checkError } = await supabase
        .from(table)
        .select('id')
        .limit(1)
      
      if (checkError) {
        console.log(`❌ ${table} table does not exist`)
      } else {
        console.log(`✅ ${table} table exists`)
      }
    }

    console.log('\n🎯 Next Steps:')
    console.log('1. Execute the SQL in your Supabase dashboard (if tables don\'t exist)')
    console.log('2. Test the payout system: node test-payout-api.js')
    console.log('3. Visit the test page: http://localhost:3000/test-payout')
    console.log('4. The payout method error will be fixed!')

  } catch (error) {
    console.error('❌ Setup error:', error.message)
  }
}

// Run the setup
executePayoutSetup()
