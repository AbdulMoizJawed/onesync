// generate-fresh-checkout.js
require('dotenv').config({ path: '.env.local' })
const Stripe = require('stripe')
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function generateCheckouts() {
  console.clear()
  console.log('='.repeat(60))
  console.log('🎯 FRESH CHECKOUT SESSION GENERATOR')
  console.log('='.repeat(60))
  console.log('')
  
  try {
    // Create Quick Test Payment
    console.log('💳 Creating Quick Test Payment ($9.99)...')
    
    const testSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Webhook Test Payment',
            description: 'Small payment to test webhook flow',
          },
          unit_amount: 999, // $9.99
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://b1fc5d92a250.ngrok-free.app/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://b1fc5d92a250.ngrok-free.app/cancel',
      metadata: {
        type: 'test_payment',
        test: 'true',
        timestamp: new Date().toISOString(),
      },
    })
    
    console.log('✅ Created!')
    console.log(`   Session ID: ${testSession.id}`)
    console.log(`   Amount: $${testSession.amount_total / 100}`)
    console.log('')
    
    // Create Playlist Campaign
    console.log('🎵 Creating Playlist Campaign Checkout ($99)...')
    
    const playlistSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Indie Playlist Campaign',
            description: 'Get your music pitched to playlist curators',
          },
          unit_amount: 9900, // $99
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://yourdomain.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://yourdomain.com/cancel',
      metadata: {
        type: 'playlist_campaign',
        test: 'true',
        timestamp: new Date().toISOString(),
      },
    })
    
    console.log('✅ Created!')
    console.log(`   Session ID: ${playlistSession.id}`)
    console.log(`   Amount: $${playlistSession.amount_total / 100}`)
    console.log('')
    
    // Display payment URLs
    console.log('='.repeat(60))
    console.log('🔗 PAYMENT URLS (Click to Complete)')
    console.log('='.repeat(60))
    console.log('')
    
    console.log('1. QUICK TEST ($9.99) - START HERE ⭐')
    console.log(testSession.url)
    console.log('')
    
    console.log('2. PLAYLIST CAMPAIGN ($99)')
    console.log(playlistSession.url)
    console.log('')
    
    console.log('='.repeat(60))
    console.log('💳 TEST CARD DETAILS')
    console.log('='.repeat(60))
    console.log('')
    console.log('Card Number: 4242 4242 4242 4242')
    console.log('Expiry Date: 12/25')
    console.log('CVC: 123')
    console.log('ZIP: 12345')
    console.log('')
    
    console.log('='.repeat(60))
    console.log('📋 WHAT TO DO NEXT')
    console.log('='.repeat(60))
    console.log('')
    console.log('1. Click the first URL above (Quick Test)')
    console.log('2. Enter the test card details')
    console.log('3. Complete the payment')
    console.log('4. Watch your terminal for webhook logs')
    console.log('5. Run: node verify-payment-flow.js')
    console.log('')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

generateCheckouts()