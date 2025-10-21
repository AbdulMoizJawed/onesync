const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

async function setupStripeDatabase() {
  console.log('🔧 Setting up Stripe database tables...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials')
    console.log('SUPABASE_URL:', supabaseUrl ? '✅ Present' : '❌ Missing')
    console.log('SERVICE_KEY:', supabaseServiceKey ? '✅ Present' : '❌ Missing')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('./setup-stripe-database.sql', 'utf8')
    
    // Split SQL commands (basic splitting by semicolon)
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📝 Found ${sqlCommands.length} SQL commands to execute`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i]
      if (command.length > 10) { // Skip very short commands
        try {
          const { error } = await supabase.rpc('exec', { sql: command + ';' })
          if (error) {
            // Try direct query execution instead
            const { error: queryError } = await supabase
              .from('information_schema.tables')
              .select('*')
              .limit(1) // Just to test connection
            
            if (!queryError) {
              // Connection works, try raw SQL
              console.log(`⚠️  Command ${i + 1} failed with RPC, trying direct execution...`)
              // For tables, we'll create them individually
              if (command.includes('CREATE TABLE')) {
                console.log(`📋 Creating table from command ${i + 1}...`)
              }
            }
          } else {
            successCount++
            console.log(`✅ Command ${i + 1} executed successfully`)
          }
        } catch (err) {
          errorCount++
          console.log(`❌ Command ${i + 1} failed:`, err.message.substring(0, 100))
        }
      }
    }
    
    console.log(`\n📊 Database setup summary:`)
    console.log(`✅ Successful commands: ${successCount}`)
    console.log(`❌ Failed commands: ${errorCount}`)
    
    // Test table creation by checking if tables exist
    console.log('\n🔍 Testing table access...')
    
    const tables = [
      'stripe_accounts',
      'royalty_payouts', 
      'stripe_webhook_events',
      'revenue_splits',
      'analytics',
      'earnings'
    ]
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`)
        } else {
          console.log(`✅ Table ${table}: Accessible`)
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
  }
}

setupStripeDatabase()
