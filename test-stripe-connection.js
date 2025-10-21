#!/usr/bin/env node

/**
 * Test Stripe Connection
 * Run: node test-stripe-connection.js
 */

require('dotenv').config({ path: '.env.local' })
const Stripe = require('stripe')

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
}

async function testStripeConnection() {
  console.log('\n🔍 Testing Stripe Integration...\n')

  // Check environment variables
  const secretKey = process.env.STRIPE_SECRET_KEY
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secretKey) {
    log.error('STRIPE_SECRET_KEY not found in .env.local')
    log.info('Please create .env.local file with: cp .env.example .env.local')
    process.exit(1)
  }

  if (!publishableKey) {
    log.warning('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found')
  } else {
    log.success('Publishable key found')
  }

  if (!webhookSecret) {
    log.warning('STRIPE_WEBHOOK_SECRET not configured (optional for dev)')
  }

  // Determine if test or live mode
  const isTestMode = secretKey.startsWith('sk_test_')
  const isLiveMode = secretKey.startsWith('sk_live_')

  if (isTestMode) {
    log.info('Using TEST mode (safe for development)')
  } else if (isLiveMode) {
    log.warning('Using LIVE mode (processes real money!)')
  } else {
    log.error('Invalid Stripe key format')
    process.exit(1)
  }

  // Test connection to Stripe
  try {
    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-11-20.acacia'
    })

    log.info('Connecting to Stripe API...')

    // Retrieve account balance
    const balance = await stripe.balance.retrieve()
    log.success('Successfully connected to Stripe!')
    
    console.log('\n💰 Account Balance:')
    if (balance.available && balance.available.length > 0) {
      balance.available.forEach(b => {
        console.log(`   ${b.currency.toUpperCase()}: ${(b.amount / 100).toFixed(2)}`)
      })
    } else {
      console.log('   No funds available')
    }

    if (balance.pending && balance.pending.length > 0) {
      console.log('\n⏳ Pending Balance:')
      balance.pending.forEach(b => {
        console.log(`   ${b.currency.toUpperCase()}: ${(b.amount / 100).toFixed(2)}`)
      })
    }

    // Test creating a test token (only in test mode)
    if (isTestMode) {
      log.info('\nTesting card tokenization...')
      try {
        const token = await stripe.tokens.create({
          card: {
            number: '4242424242424242',
            exp_month: 12,
            exp_year: new Date().getFullYear() + 1,
            cvc: '123'
          }
        })
        log.success('Card tokenization working!')
      } catch (tokenError) {
        log.warning('Card tokenization test failed (this is optional)')
      }

      // List recent events
      log.info('\nFetching recent Stripe events...')
      try {
        const events = await stripe.events.list({ limit: 3 })
        if (events.data.length > 0) {
          log.success(`Found ${events.data.length} recent events`)
          events.data.forEach((event, idx) => {
            console.log(`   ${idx + 1}. ${event.type} (${new Date(event.created * 1000).toLocaleString()})`)
          })
        } else {
          log.info('No recent events (this is normal for new accounts)')
        }
      } catch (eventsError) {
        log.warning('Could not fetch events')
      }
    }

    console.log('\n📋 Configuration Summary:')
    console.log(`   Mode: ${isTestMode ? 'TEST' : 'LIVE'}`)
    console.log(`   Secret Key: ${secretKey.substring(0, 20)}...`)
    console.log(`   Publishable Key: ${publishableKey ? publishableKey.substring(0, 20) + '...' : 'Not set'}`)
    console.log(`   Webhook Secret: ${webhookSecret ? 'Configured' : 'Not configured'}`)

    console.log('\n✅ STRIPE INTEGRATION WORKING!\n')
    
    if (isTestMode) {
      console.log('📝 Test Cards for Development:')
      console.log('   Success: 4242 4242 4242 4242')
      console.log('   Declined: 4000 0000 0000 0002')
      console.log('   Requires Auth: 4000 0025 0000 3155')
      console.log('   Any future date for expiry, any 3-digit CVC\n')
    }

    console.log('🚀 Next Steps:')
    console.log('   1. Run: npm run dev')
    console.log('   2. Visit: http://localhost:3000/payments')
    console.log('   3. Test creating a Stripe Connect account\n')

  } catch (error) {
    log.error(`Failed to connect to Stripe: ${error.message}`)
    
    if (error.type === 'StripeAuthenticationError') {
      log.info('Your API key is invalid. Please check:')
      console.log('   1. Key starts with sk_test_ or sk_live_')
      console.log('   2. Key is from: https://dashboard.stripe.com/apikeys')
      console.log('   3. Key is correctly copied to .env.local')
    }
    
    process.exit(1)
  }
}

// Run the test
testStripeConnection().catch(error => {
  log.error(`Unexpected error: ${error.message}`)
  process.exit(1)
})

