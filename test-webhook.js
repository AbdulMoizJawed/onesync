// test-webhook-complete.js
// Complete webhook testing script for Stripe integration
// This tests all webhook events: payments, checkouts, payouts, and Connect accounts

require('dotenv').config({ path: '.env.local' })
const Stripe = require('stripe')

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
})

// Color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
}

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`)
}

function section(title) {
  console.log(`\n${colors.bright}${'='.repeat(60)}${colors.reset}`)
  console.log(`${colors.bright}${title}${colors.reset}`)
  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}\n`)
}

// Validate environment
function validateEnvironment() {
  section('🔍 ENVIRONMENT VALIDATION')
  
  const required = {
    'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY,
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    'STRIPE_WEBHOOK_SECRET': process.env.STRIPE_WEBHOOK_SECRET,
  }
  
  let valid = true
  
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      log('❌', `${key}: Missing`, colors.red)
      valid = false
    } else {
      const preview = value.substring(0, 20) + '...'
      log('✅', `${key}: ${preview}`, colors.green)
    }
  }
  
  if (!valid) {
    log('🚨', 'Missing required environment variables!', colors.red)
    console.log('\nAdd these to your .env.local file:')
    console.log('STRIPE_SECRET_KEY=sk_test_...')
    console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...')
    console.log('STRIPE_WEBHOOK_SECRET=whsec_...')
    process.exit(1)
  }
  
  log('🎉', 'All environment variables configured!', colors.green)
}

// Test 1: Payment Intent (Direct Payment)
async function testPaymentIntent() {
  section('TEST 1: Payment Intent (Direct Payment)')
  
  try {
    log('🔄', 'Creating payment intent...', colors.blue)
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2999, // $29.99
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        test: 'webhook_test',
        type: 'payment_intent',
        timestamp: new Date().toISOString(),
      },
    })
    
    log('✅', `Payment Intent created: ${paymentIntent.id}`, colors.green)
    log('💰', `Amount: $${paymentIntent.amount / 100}`, colors.cyan)
    log('📊', `Status: ${paymentIntent.status}`, colors.cyan)
    
    console.log('\n📋 To complete this payment and trigger webhook:')
    console.log(`   1. Payment Intent ID: ${colors.yellow}${paymentIntent.id}${colors.reset}`)
    console.log(`   2. Client Secret: ${colors.yellow}${paymentIntent.client_secret}${colors.reset}`)
    console.log(`   3. Use Stripe test card: ${colors.green}4242 4242 4242 4242${colors.reset}`)
    console.log(`   4. Any future date, any CVC, any ZIP`)
    
    console.log('\n🔔 Expected webhook events:')
    console.log('   • payment_intent.created')
    console.log('   • payment_intent.succeeded (after payment)')
    
    return paymentIntent
    
  } catch (error) {
    log('❌', `Error: ${error.message}`, colors.red)
    throw error
  }
}

// Test 2: Checkout Session (Hosted Checkout Page)
async function testCheckoutSession() {
  section('TEST 2: Checkout Session (Playlist Campaign)')
  
  try {
    log('🔄', 'Creating checkout session...', colors.blue)
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Indie Playlist Campaign',
              description: 'Webhook Test - Playlist Pitching',
              images: ['https://via.placeholder.com/300'],
            },
            unit_amount: 9900, // $99.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://yourdomain.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://yourdomain.com/cancel',
      metadata: {
        test: 'webhook_test',
        type: 'playlist_campaign',
        campaign_tier: 'indie',
        timestamp: new Date().toISOString(),
      },
    })
    
    log('✅', `Checkout session created: ${session.id}`, colors.green)
    log('💰', `Amount: $${session.amount_total / 100}`, colors.cyan)
    log('📊', `Status: ${session.status}`, colors.cyan)
    
    console.log(`\n${colors.bright}🔗 COMPLETE PAYMENT HERE:${colors.reset}`)
    console.log(`${colors.yellow}${session.url}${colors.reset}`)
    
    console.log(`\n💳 Use test card: ${colors.green}4242 4242 4242 4242${colors.reset}`)
    console.log('   Any future date, any CVC, any ZIP')
    
    console.log('\n🔔 Expected webhook events:')
    console.log('   • checkout.session.completed (after payment)')
    console.log('   • payment_intent.succeeded')
    
    console.log('\n⏱️  Waiting for payment completion...')
    console.log('   (Check your webhook logs in terminal)')
    
    return session
    
  } catch (error) {
    log('❌', `Error: ${error.message}`, colors.red)
    throw error
  }
}

// Test 3: Beat Purchase (Another Checkout)
async function testBeatPurchase() {
  section('TEST 3: Beat Purchase (Marketplace)')
  
  try {
    log('🔄', 'Creating beat purchase checkout...', colors.blue)
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Premium Hip-Hop Beat',
              description: 'Webhook Test - Beat Marketplace',
              images: ['https://via.placeholder.com/300'],
            },
            unit_amount: 4999, // $49.99
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://yourdomain.com/beats/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://yourdomain.com/beats',
      metadata: {
        test: 'webhook_test',
        type: 'beat_purchase',
        beat_id: 'test_beat_123',
        license_type: 'premium',
        timestamp: new Date().toISOString(),
      },
    })
    
    log('✅', `Beat purchase session created: ${session.id}`, colors.green)
    log('💰', `Amount: $${session.amount_total / 100}`, colors.cyan)
    
    console.log(`\n${colors.bright}🔗 COMPLETE PURCHASE HERE:${colors.reset}`)
    console.log(`${colors.yellow}${session.url}${colors.reset}`)
    
    console.log(`\n💳 Use test card: ${colors.green}4242 4242 4242 4242${colors.reset}`)
    
    console.log('\n🔔 Expected webhook events:')
    console.log('   • checkout.session.completed')
    console.log('   • payment_intent.succeeded')
    
    return session
    
  } catch (error) {
    log('❌', `Error: ${error.message}`, colors.red)
    throw error
  }
}

// Test 4: Stripe Connect Account (Artist Payout Setup)
async function testConnectAccount() {
  section('TEST 4: Stripe Connect Account (Artist Payouts)')
  
  try {
    log('🔄', 'Creating Connect account...', colors.blue)
    
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: 'test-artist@example.com',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        test: 'webhook_test',
        user_id: 'test_user_123',
        timestamp: new Date().toISOString(),
      },
    })
    
    log('✅', `Connect account created: ${account.id}`, colors.green)
    log('📊', `Type: ${account.type}`, colors.cyan)
    log('🌍', `Country: ${account.country}`, colors.cyan)
    
    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://yourdomain.com/payments/reauth',
      return_url: 'https://yourdomain.com/payments/return',
      type: 'account_onboarding',
    })
    
    console.log(`\n${colors.bright}🔗 COMPLETE ONBOARDING HERE:${colors.reset}`)
    console.log(`${colors.yellow}${accountLink.url}${colors.reset}`)
    
    console.log('\n📋 Use test information:')
    console.log('   Business name: Test Artist LLC')
    console.log('   DOB: 01/01/1990')
    console.log('   Address: 123 Test St, San Francisco, CA 94102')
    console.log('   Phone: (555) 555-5555')
    console.log('   Bank Routing: 110000000')
    console.log('   Bank Account: 000123456789')
    
    console.log('\n🔔 Expected webhook events:')
    console.log('   • account.updated (multiple times during onboarding)')
    console.log('   • capability.updated (when capabilities enabled)')
    
    return account
    
  } catch (error) {
    log('❌', `Error: ${error.message}`, colors.red)
    throw error
  }
}

// Test 5: Payout (Artist Withdrawal)
async function testPayout() {
  section('TEST 5: Payout (Artist Withdrawal)')
  
  try {
    log('⚠️', 'Payout test requires a verified Connect account', colors.yellow)
    log('ℹ️', 'This is a simulation - actual payouts need real accounts', colors.cyan)
    
    console.log('\n📋 To test payouts manually:')
    console.log('   1. Complete Connect account onboarding (Test 4)')
    console.log('   2. Ensure account is verified')
    console.log('   3. Create payout via admin dashboard')
    console.log('   4. Monitor webhook for payout.paid or payout.failed')
    
    console.log('\n🔔 Expected webhook events:')
    console.log('   • payout.created')
    console.log('   • payout.paid (when successful)')
    console.log('   • payout.failed (if issues occur)')
    
    // Show example of how payout would be created
    console.log('\n💡 Example payout creation code:')
    console.log(`${colors.cyan}
const payout = await stripe.payouts.create({
  amount: 5000, // $50.00
  currency: 'usd',
  metadata: { user_id: 'test_user_123' }
}, {
  stripeAccount: 'acct_xxxxx' // Connect account ID
});
${colors.reset}`)
    
  } catch (error) {
    log('❌', `Error: ${error.message}`, colors.red)
  }
}

// Test 6: Check Recent Webhook Events
async function checkWebhookEvents() {
  section('📊 RECENT WEBHOOK EVENTS')
  
  try {
    log('🔄', 'Fetching recent webhook events...', colors.blue)
    
    const events = await stripe.events.list({
      limit: 10,
    })
    
    if (events.data.length === 0) {
      log('ℹ️', 'No recent events found', colors.yellow)
      return
    }
    
    log('✅', `Found ${events.data.length} recent events:`, colors.green)
    console.log('')
    
    events.data.forEach((event, index) => {
      const timestamp = new Date(event.created * 1000).toLocaleString()
      const statusEmoji = event.livemode ? '🟢' : '🟡'
      console.log(`${index + 1}. ${statusEmoji} ${colors.cyan}${event.type}${colors.reset}`)
      console.log(`   ID: ${event.id}`)
      console.log(`   Time: ${timestamp}`)
      console.log(`   Mode: ${event.livemode ? 'Live' : 'Test'}`)
      console.log('')
    })
    
  } catch (error) {
    log('❌', `Error: ${error.message}`, colors.red)
  }
}

// Test 7: Verify Webhook Endpoint
async function verifyWebhookEndpoint() {
  section('🔍 WEBHOOK ENDPOINT VERIFICATION')
  
  try {
    log('🔄', 'Fetching webhook endpoints...', colors.blue)
    
    const endpoints = await stripe.webhookEndpoints.list({
      limit: 10,
    })
    
    if (endpoints.data.length === 0) {
      log('⚠️', 'No webhook endpoints configured!', colors.yellow)
      console.log('\nCreate one at: https://dashboard.stripe.com/test/webhooks')
      return
    }
    
    log('✅', `Found ${endpoints.data.length} webhook endpoint(s):`, colors.green)
    console.log('')
    
    endpoints.data.forEach((endpoint, index) => {
      const status = endpoint.status === 'enabled' ? '🟢' : '🔴'
      console.log(`${index + 1}. ${status} ${colors.cyan}${endpoint.url}${colors.reset}`)
      console.log(`   ID: ${endpoint.id}`)
      console.log(`   Status: ${endpoint.status}`)
      console.log(`   Events: ${endpoint.enabled_events.length} configured`)
      console.log(`   Events: ${endpoint.enabled_events.slice(0, 3).join(', ')}${endpoint.enabled_events.length > 3 ? '...' : ''}`)
      console.log('')
    })
    
  } catch (error) {
    log('❌', `Error: ${error.message}`, colors.red)
  }
}

// Main test runner
async function runAllTests() {
  console.clear()
  
  section('🧪 STRIPE WEBHOOK COMPLETE TEST SUITE')
  
  console.log('This script will test all webhook events:\n')
  console.log('✓ Payment Intents (direct payments)')
  console.log('✓ Checkout Sessions (playlist campaigns, beat purchases)')
  console.log('✓ Connect Accounts (artist payout setup)')
  console.log('✓ Payouts (artist withdrawals)')
  console.log('')
  
  try {
    // Step 0: Validate environment
    validateEnvironment()
    
    // Step 1: Verify webhook endpoint exists
    await verifyWebhookEndpoint()
    
    // Step 2: Check recent events
    await checkWebhookEvents()
    
    // Step 3: Run payment tests
    await testPaymentIntent()
    
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
    
    await testCheckoutSession()
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    await testBeatPurchase()
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 4: Run Connect account test
    await testConnectAccount()
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 5: Show payout info
    await testPayout()
    
    // Final summary
    section('✅ TEST SUITE COMPLETED')
    
    console.log('📋 Next Steps:\n')
    console.log('1. Complete the payment URLs shown above')
    console.log('2. Watch your terminal/server logs for webhook events')
    console.log('3. Check Stripe Dashboard > Webhooks for delivery status')
    console.log('4. Verify database records are created correctly')
    
    console.log(`\n🔗 Useful Links:`)
    console.log(`   • Webhooks: ${colors.cyan}https://dashboard.stripe.com/test/webhooks${colors.reset}`)
    console.log(`   • Events: ${colors.cyan}https://dashboard.stripe.com/test/events${colors.reset}`)
    console.log(`   • Payments: ${colors.cyan}https://dashboard.stripe.com/test/payments${colors.reset}`)
    
    console.log(`\n${colors.green}${colors.bright}🎉 All tests created successfully!${colors.reset}\n`)
    
  } catch (error) {
    section('❌ TEST SUITE FAILED')
    console.error(error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('\n❌ Fatal error:', error.message)
    process.exit(1)
  })
}

module.exports = {
  testPaymentIntent,
  testCheckoutSession,
  testBeatPurchase,
  testConnectAccount,
  testPayout,
  checkWebhookEvents,
  verifyWebhookEndpoint,
}